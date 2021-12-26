import { Box } from "./box.js";
import { Circle } from "./circle.js";
import { Type } from "./rigidbody.js";
import { Matrix3, Vector2 } from "./math.js";
import { Polygon } from "./polygon.js";
import { Settings } from "./settings.js";
export function toFixed(value, limit = 1e-13) {
    return Math.round(value / limit) * limit;
}
// Project point p to edge ab, calculate barycentric weights and return it
export function getUV(a, b, p) {
    let dir = b.sub(a);
    const len = dir.length;
    dir.normalize();
    const region = dir.dot(p.sub(a)) / len;
    return { u: 1 - region, v: region };
}
// Linearly combine(interpolate) the vector using weights u, v
export function lerpVector(a, b, uv) {
    // return a.mul(uv.u).add(b.mul(uv.v));
    return new Vector2(a.x * uv.u + b.x * uv.v, a.y * uv.u + b.y * uv.v);
}
export function createRandomConvexBody(radius, numVertices = -1) {
    if (numVertices < 0)
        numVertices = Math.trunc(Math.random() * Settings.randomConvexMaxVertices);
    if (numVertices == 0)
        return new Circle(radius);
    if (numVertices == Settings.randomConvexMaxVertices - 1)
        return new Box(radius * 2, radius * 2);
    numVertices += 2;
    let angles = [];
    for (let i = 0; i < numVertices; i++)
        angles.push(Math.random() * Math.PI * 2);
    angles.sort();
    let res = new Polygon(angles.map((angle) => {
        return new Vector2(Math.cos(angle), Math.sin(angle)).mul(radius);
    }));
    return res;
}
export function createRegularPolygon(radius, numVertices = -1, initialAngle) {
    if (numVertices < 3)
        numVertices = Math.trunc(random(3, Settings.regularPolygonMaxVertices));
    let angleStart = initialAngle != undefined ? initialAngle : Math.PI / 2.0;
    let angle = Math.PI * 2 / numVertices;
    if ((numVertices % 2) == 0)
        angleStart += angle / 2.0;
    let vertices = [];
    for (let i = 0; i < numVertices; i++) {
        let currentAngle = angleStart + angle * i;
        vertices.push(new Vector2(Math.cos(currentAngle), Math.sin(currentAngle)).mul(radius * 1.4142));
    }
    return new Polygon(vertices, Type.Dynamic);
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
    // return Math.max(min, Math.min(value, max));
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
export function calculateBoxInertia(width, height, mass) {
    return (width * width + height * height) * mass / 12.0;
}
export function calculateCircleInertia(radius, mass) {
    return mass * radius * radius / 2.0;
}
// This function assumes the origin is the rotation axis
export function calculateConvexPolygonInertia(vertices, mass, area = -1) {
    let inertia = 0;
    let count = vertices.length;
    if (area <= 0) {
        area = 0;
        for (let i = 0; i < count; i++) {
            let v1 = vertices[i];
            let v2 = vertices[(i + 1) % count];
            area += Math.abs(v1.cross(v2));
        }
        area *= 0.5;
    }
    for (let i = 0; i < count; i++) {
        let v1 = vertices[i];
        let v2 = vertices[(i + 1) % count];
        let l1 = v1.length;
        let l2 = v2.length;
        let beta = Math.acos(v1.dot(v2) / (l1 * l2)) / 2;
        let partialMass = (Math.abs(v1.cross(v2)) / 2.0) / area * mass;
        inertia += 0.5 * partialMass * l1 * l2 * (1 - 2.0 / 3.0 * Math.sin(beta) * Math.sin(beta));
    }
    return inertia;
}
export function checkInside(b, p) {
    let localP = b.globalToLocal.mulVector2(p, 1);
    if (b instanceof Circle) {
        return localP.length <= b.radius;
    }
    else if (b instanceof Polygon) {
        let poly = b;
        let dir = poly.vertices[0].sub(localP).cross(poly.vertices[1].sub(localP));
        for (let i = 1; i < poly.vertices.length; i++) {
            let nDir = poly.vertices[i].sub(localP).cross(poly.vertices[(i + 1) % poly.count].sub(localP));
            if (dir * nDir < 0)
                return false;
        }
        return true;
    }
    else {
        throw "Not a supported shape";
    }
}
// Cantor pairing function, ((N, N) -> N) mapping function
// https://en.wikipedia.org/wiki/Pairing_function#Cantor_pairing_function
export function make_pair_natural(a, b) {
    return (a + b) * (a + b + 1) / 2 + b;
}
// Reverse version of pairing function
// this guarantees initial pairing order
export function separate_pair(p) {
    let w = Math.floor((Math.sqrt(8 * p + 1) - 1) / 2.0);
    let t = (w * w + w) / 2.0;
    let y = p - t;
    let x = w - y;
    return { p1: x, p2: y };
}
export function squared_distance(a, b) {
    return (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y);
}
export function map(v, left, right, min, max) {
    const per = (v - left) / (right - left);
    return lerp(min, max, per);
}
export function lerp(left, right, per) {
    return left + (right - left) * per;
}
export function mid(a, b) {
    return new Vector2((a.x + b.x) / 2.0, (a.y + b.y) / 2.0);
}
// Create a 2D orthographic projection matrix
export function orth(left, right, bottom, top) {
    let res = new Matrix3();
    // Scale
    res.m00 = 2.0 / (right - left);
    res.m11 = 2.0 / (top - bottom);
    // Translation
    res.m02 = -(right + left) / (right - left);
    res.m12 = -(top + bottom) / (top - bottom);
    return res;
}
// Create a viewport transform matrix
export function viewport(width, height, xStart = 0, yStart = 0) {
    let res = new Matrix3();
    // Scale
    res.m00 = width / 2.0;
    res.m11 = height / 2.0;
    // Translation
    res.m02 = xStart + width / 2.0;
    res.m12 = yStart + height / 2.0;
    return res;
}
export function assert(...test) {
    for (let i = 0; i < test.length; i++)
        if (!test[i])
            throw new Error("Assertion failed");
}
