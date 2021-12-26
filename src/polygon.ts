import { RigidBody, Type } from "./rigidbody.js";
import { Vector2 } from "./math.js";
import * as Util from "./util.js";

// Children: Box
export class Polygon extends RigidBody
{
    public readonly vertices: Vector2[];
    public readonly area: number;
    protected _density: number;

    constructor(vertices: Vector2[], type: Type = Type.Dynamic, resetPosition: boolean = true)
    {
        super(type);

        this.vertices = vertices;

        let centerOfMass = new Vector2(0, 0);

        let count = this.count;

        for (let i = 0; i < count; i++)
        {
            centerOfMass.x += this.vertices[i].x;
            centerOfMass.y += this.vertices[i].y;
        }

        centerOfMass.x /= count;
        centerOfMass.y /= count;

        let area = 0;

        this.vertices[0].x -= centerOfMass.x;
        this.vertices[0].y -= centerOfMass.y;

        for (let i = 1; i < count; i++)
        {
            this.vertices[i].x -= centerOfMass.x;
            this.vertices[i].y -= centerOfMass.y;

            area += this.vertices[i - 1].cross(this.vertices[i]);
        }

        area += this.vertices[count - 1].cross(this.vertices[0]);

        this.area = Math.abs(area) / 2.0;
        super.inertia = Util.calculateConvexPolygonInertia(this.vertices, this.mass, this.area);
        this._density = this.mass / this.area;

        if (!resetPosition)
            this.translate(centerOfMass);
    }

    repositionCenterOfMass(p: Vector2)
    {
        for (let i = 0; i < this.vertices.length; i++)
        {
            let vertex = this.vertices[i];
            vertex.x -= p.x;
            vertex.y -= p.y;
        }
    }

    get count(): number
    {
        return this.vertices.length;
    }

    get mass(): number
    {
        return super.mass;
    }

    // This will automatically set the inertia
    set mass(mass: number)
    {
        super.mass = mass;
        super.inertia = Util.calculateConvexPolygonInertia(this.vertices, this.mass, this.area);
        this._density = mass / this.area;
    }

    get density(): number
    {
        return this._density;
    }

    // This will automatically set the mass and inertia
    set density(density: number)
    {
        super.mass = density * this.area;
        super.inertia = Util.calculateConvexPolygonInertia(this.vertices, this.mass, this.area);
        this._density = density;
    }
}