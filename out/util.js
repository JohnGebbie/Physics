import { Box } from "./box.js";
import { Circle } from "./circle.js";
import { Shape, Type } from "./collider.js";
import { Vector2 } from "./math.js";
import { Polygon } from "./polygon.js";
export function subPolygon(p1, p2) {
    let res = [];
    for (let i = 0; i < p1.count; i++) {
        let p1v = p1.localToGlobal().mulVector(p1.vertices[i], 1);
        for (let j = 0; j < p2.count; j++) {
            let p2v = p2.localToGlobal().mulVector(p2.vertices[j], 1);
            res.push(p1v.subV(p2v));
        }
    }
    return new Polygon(res, Type.Normal, false);
}
export function toFixed(value) {
    return Math.round(value * 1e13) / 1e13;
}
// Project point p to edge ab, calculate barycentric weights and return it
export function getUV(a, b, p) {
    let dir = b.subV(a);
    const len = dir.length;
    dir.normalize();
    const region = dir.dot(p.subV(a)) / len;
    return { u: 1 - region, v: region };
}
// Linearly combine(interpolate) the vector using weights u, v
export function lerpVector(a, b, uv) {
    return a.mulS(uv.u).addV(b.mulS(uv.v));
}
const maxVertices = 8;
export function createRandomConvexCollider(radius = 50, numVertices = -1) {
    if (numVertices < 0)
        numVertices = Math.trunc(Math.random() * maxVertices);
    if (numVertices == 0)
        return new Circle(new Vector2(), radius);
    if (numVertices == maxVertices - 1)
        return new Box(new Vector2(), new Vector2(radius * 2, radius * 2));
    numVertices += 2;
    let angles = [];
    for (let i = 0; i < numVertices; i++)
        angles.push(Math.random() * Math.PI * 2);
    angles.sort();
    let res = new Polygon(angles.map((angle) => {
        return new Vector2(Math.cos(angle), Math.sin(angle)).mulS(radius);
    }));
    res.mass = 20;
    res.inertia = res.mass * (radius * radius * 2) / 12.0;
    return res;
}
export function random(left = -1, right = 1) {
    if (left > right) {
        let tmp = right;
        right = left;
        left = tmp;
    }
    let range = right - left;
    return Math.random() * range + left;
}
export function clamp(value, min, max) {
    if (value < min)
        return min;
    else if (value > max)
        return max;
    else
        return value;
}
export function cross(scalar, vector) {
    return new Vector2(-scalar * vector.y, scalar * vector.x);
}
export function calculateBoxInertia(w, h, mass) {
    return (w * w + h * h) * mass / 12;
}
export function checkInside(c, p) {
    let localP = c.globalToLocal().mulVector(p, 1);
    switch (c.shape) {
        case Shape.Circle:
            return localP.length <= c.radius;
        case Shape.Polygon:
            {
                let poly = c;
                let dir = poly.vertices[0].subV(localP).cross(poly.vertices[1].subV(localP));
                for (let i = 1; i < poly.vertices.length; i++) {
                    let nDir = poly.vertices[i].subV(localP).cross(poly.vertices[(i + 1) % poly.count].subV(localP));
                    if (dir * nDir < 0)
                        return false;
                }
                return true;
            }
        default:
            throw "Not supported shape";
    }
}
// Cantor pairing function
// https://en.wikipedia.org/wiki/Pairing_function#Cantor_pairing_function
export function make_pair_natural(a, b) {
    return (a + b) * (a + b + 1) / 2 + b;
}
export function squared_distance(a, b) {
    return (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y);
}
