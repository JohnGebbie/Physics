import { Entity } from "./entity.js";
import { Vector2 } from "./math.js";
import * as Util from "./util.js";

export enum Shape
{
    Circle = 0,
    Polygon
}
export enum Type
{
    Ground = 0,
    Normal
}

// Rigid body collider
export class Collider extends Entity
{
    public readonly shape: Shape;

    private _force: Vector2 = new Vector2();
    private _torque: number = 0;
    private _mass!: number; // kg
    private _invMass!: number;
    private _inertia!: number;
    private _invInertia!: number;
    private _cm!: Vector2;
    private _linearVelocity: Vector2;
    private _angularVelocity: number;
    private _friction: number;
    private _beta: number;
    private _restitution: number;

    public readonly type: Type;

    public id!: number;

    constructor(shape: Shape, type: Type)
    {
        super();
        this.shape = shape;

        this._linearVelocity = new Vector2(0, 0);
        this._angularVelocity = 0;
        this._friction = 0.95;
        this._beta = 0.5;
        this._restitution = 0.5;
        this.type = type;

        if (this.type == Type.Ground)
        {
            this.mass = Number.MAX_VALUE;
            this.inertia = Number.MAX_VALUE;
        }
    }

    get mass(): number
    {
        return this._mass;
    }

    set mass(m: number)
    {
        this._mass = Util.clamp(m, 0, Number.MAX_VALUE);
        this._invMass = this._mass == 0 ? 0 : 1.0 / this._mass;
    }

    get inverseMass(): number
    {
        return this._invMass;
    }

    get inertia(): number
    {
        return this._inertia;
    }

    set inertia(i: number)
    {
        this._inertia = Util.clamp(i, 0, Number.MAX_VALUE);
        this._invInertia = this._inertia == 0 ? 0 : 1.0 / i;
    }

    get inverseInertia(): number
    {
        return this._invInertia;
    }

    get centerOfMass(): Vector2
    {
        return this._cm;
    }

    protected set centerOfMass(cm: Vector2)
    {
        this._cm = cm.copy();
    }

    get friction(): number
    {
        return this._friction;
    }

    set friction(f: number)
    {
        this._friction = Util.clamp(f, 0, Number.MAX_VALUE);
    }

    get contactBeta(): number
    {
        return this._beta;
    }

    set contactBeta(b: number)
    {
        this._beta = Util.clamp(b, 0, 1);
    }

    get restitution(): number
    {
        return this._restitution;
    }

    set restitution(r: number)
    {
        this._restitution = Util.clamp(r, 0, 1);
    }

    get linearVelocity(): Vector2
    {
        return this._linearVelocity;
    }

    set linearVelocity(v: Vector2)
    {
        this._linearVelocity = v.copy();
    }

    get angularVelocity(): number
    {
        return this._angularVelocity;
    }

    set angularVelocity(w: number)
    {
        this._angularVelocity = w;
    }

    get force(): Vector2
    {
        return this._force;
    }

    set force(f: Vector2)
    {
        this._force = f.copy();
    }

    get torque(): number
    {
        return this._torque;
    }

    set torque(t)
    {
        this._torque = t;
    }

    addForce(f: Vector2): void
    {
        this._force = this._force.addV(f);
    }

    addTorque(t: number): void
    {
        this._torque += t;
    }

    addVelocity(vt: Vector2): void //accelerate
    {
        this._linearVelocity.x += vt.x;
        this._linearVelocity.y += vt.y;
    }

    addAngularVelocity(wt: number): void
    {
        this._angularVelocity += wt;
    }
}