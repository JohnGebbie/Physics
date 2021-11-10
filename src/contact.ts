import { Collider } from "./collider";
import { Vector2 } from "./math.js";
import * as Util from "./util.js";

enum ConstraintType
{
    Normal,
    Tangent
}

interface Jacobian
{
    va: Vector2;
    wa: number;
    vb: Vector2;
    wb: number;
}

class ContactConstraintSolver
{
    public static penetration_slop = 0.5;
    public static restitution_slop = 10.0; // This has to be greater than (gravity * delta)

    private readonly manifold: ContactManifold;

    private readonly a: Collider;
    private readonly b: Collider;
    private readonly contactPoint: Vector2;
    private readonly ra: Vector2;
    private readonly rb: Vector2;
    private constraintType!: ConstraintType;

    private jacobian!: Jacobian;
    private bias: number = 0.0;
    private effectiveMass!: number;

    private beta!: number;
    private restitution!: number;
    private friction!: number;

    private impulseSum: number = 0.0; // For accumulated impulse

    constructor(contact: ContactManifold, contactPoint: Vector2)
    {
        this.manifold = contact;
        this.a = contact.bodyA;
        this.b = contact.bodyB;
        this.contactPoint = contactPoint;
        this.ra = this.contactPoint.subV(this.a.localToGlobal().mulVector(this.a.centerOfMass, 1));
        this.rb = this.contactPoint.subV(this.b.localToGlobal().mulVector(this.b.centerOfMass, 1));
    }

    init(dir: Vector2, constraintType: ConstraintType, delta: number)
    {
        this.constraintType = constraintType;

        this.beta = this.a.contactBeta * this.b.contactBeta;
        this.restitution = this.a.restitution * this.b.restitution;
        this.friction = this.a.friction * this.b.friction;

        this.jacobian = {
            va: dir.inverted(),
            wa: -this.ra!.cross(dir),
            vb: dir,
            wb: this.rb!.cross(dir),
        }

        if (this.constraintType == ConstraintType.Normal)
        {
            // Relative velocity at contact point
            let relativeVelocity = this.b.linearVelocity.addV(Util.cross(this.b.angularVelocity, this.rb))
                .subV(this.a.linearVelocity.addV(Util.cross(this.a.angularVelocity, this.ra)));
            let approachingVelocity = relativeVelocity.dot(this.manifold.contactNormal!);

            this.bias = -(this.beta / delta) * Math.max(this.manifold.penetrationDepth! - ContactConstraintSolver.penetration_slop, 0) +
                this.restitution * Math.max(approachingVelocity - ContactConstraintSolver.restitution_slop, 0);
        }

        let k: number =
            + this.a.inverseMass
            + this.jacobian.wa * this.a.inverseInertia * this.jacobian.wa
            + this.b.inverseMass
            + this.jacobian.wb * this.b.inverseInertia * this.jacobian.wb;

        this.effectiveMass = 1.0 / k;
    }

    solve(friendNormal?: ContactConstraintSolver)
    {
        const a = this.manifold.bodyA;
        const b = this.manifold.bodyB;;

        // Jacobian * velocity vector
        let jv: number =
            + this.jacobian.va.dot(a.linearVelocity)
            + this.jacobian.wa * a.angularVelocity
            + this.jacobian.vb.dot(b.linearVelocity)
            + this.jacobian.wb * b.angularVelocity;

        let lambda = this.effectiveMass * -(jv + this.bias);

        let oldImpulseSum = this.impulseSum;
        switch (this.constraintType)
        {
            case ConstraintType.Normal:
                {
                    this.impulseSum = Math.max(0.0, this.impulseSum + lambda);
                    break;
                }
            case ConstraintType.Tangent:
                {
                    let maxFriction = this.friction * friendNormal!.impulseSum;
                    this.impulseSum = Util.clamp(this.impulseSum + lambda, -maxFriction, maxFriction);
                    break;
                }
        }
        lambda = this.impulseSum - oldImpulseSum;

        // Apply impulse
        a.linearVelocity = a.linearVelocity.addV(this.jacobian.va.mulS(a.inverseMass * lambda));
        a.angularVelocity = a.angularVelocity + a.inverseInertia * this.jacobian.wa * lambda;
        b.linearVelocity = b.linearVelocity.addV(this.jacobian.vb.mulS(b.inverseMass * lambda));
        b.angularVelocity = b.angularVelocity + b.inverseInertia * this.jacobian.wb * lambda;
    }
}

export class ContactManifold
{
    public readonly bodyA: Collider;
    public readonly bodyB: Collider;

    // Contact informations
    public readonly penetrationDepth: number;
    public readonly contactNormal: Vector2;
    public readonly contactTangent: Vector2;
    public readonly contactPoints: Vector2[];

    public readonly solversN: ContactConstraintSolver[] = [];
    public readonly solversT: ContactConstraintSolver[] = [];

    constructor(bodyA: Collider, bodyB: Collider, contactPoints: Vector2[], penetrationDepth: number, contactNormal: Vector2)
    {
        this.bodyA = bodyA;
        this.bodyB = bodyB;
        this.contactPoints = contactPoints;
        this.penetrationDepth = penetrationDepth;
        this.contactNormal = contactNormal;
        this.contactTangent = new Vector2(-contactNormal.y, contactNormal.x);

        for (let i = 0; i < this.numContacts; i++)
        {
            this.solversN.push(new ContactConstraintSolver(this, contactPoints[i]));
            this.solversT.push(new ContactConstraintSolver(this, contactPoints[i]));
        }
    }

    prepare(delta: number)
    {
        for (let i = 0; i < this.numContacts; i++)
        {
            this.solversN[i].init(this.contactNormal!, ConstraintType.Normal, delta);
            this.solversT[i].init(this.contactTangent!, ConstraintType.Tangent, delta);
        }
    }

    solve()
    {
        for (let i = 0; i < this.numContacts; i++)
        {
            // Order matters. To clamp friction's lambda range, you should get the normal impulse(lambda) value
            this.solversN[i].solve();
            this.solversT[i].solve(this.solversN[i]);
        }
    }

    get numContacts()
    {
        return this.contactPoints.length;
    }
}