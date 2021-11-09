import { Circle } from "./circle.js";
import { Collider } from "./collider.js";
import { Vector2 } from "./math.js";
import { Polygon } from "./polygon.js";

export function subPolygon(p1: Polygon, p2: Polygon): Polygon
{
    let res: Vector2[] = [];

    for (let i = 0; i < p1.count; i++)
    {
        let p1v = p1.localToGlobal().mulVector(p1.vertices[i], 1);
        for (let j = 0; j < p2.count; j++)
        {
            let p2v = p2.localToGlobal().mulVector(p2.vertices[j], 1);

            res.push(p1v.subV(p2v));
        }
    }

    return new Polygon(res, false);
}

export function toFixed(value: number): number
{
    return Math.round(value * 1e13) / 1e13;
}

export interface UV
{
    u: number;
    v: number;
}

// Project point p to edge ab, calculate barycentric weights and return it
export function getUV(a: Vector2, b: Vector2, p: Vector2): UV
{
    let dir = b.subV(a);
    const len = dir.getLength();
    dir.normalize();

    const region = dir.dot(p.subV(a)) / len;

    return { u: 1 - region, v: region };
}

// Linearly combine(interpolate) the vector using weights u, v
export function lerpVector(a: Vector2, b: Vector2, uv: UV): Vector2
{
    return a.mulS(uv.u).addV(b.mulS(uv.v));
}

export function createRandomConvexCollider(radius: number = 50, numVertices: number = -1): Collider
{
    if (numVertices < 0)
        numVertices = Math.trunc(Math.random() * 10);

    if (numVertices == 0)
        return new Circle(new Vector2(), radius);

    numVertices += 2;

    let angles: number[] = [];

    for (let i = 0; i < numVertices; i++)
        angles.push(Math.random() * Math.PI * 2);

    angles.sort();

    return new Polygon(angles.map((angle) =>
    {
        return new Vector2(Math.cos(angle), Math.sin(angle)).mulS(radius);
    }));
}

export interface Pair<A, B>
{
    p1: A;
    p2: B;
}