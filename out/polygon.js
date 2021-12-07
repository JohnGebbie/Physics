import { RigidBody, Type } from "./rigidbody.js";
export class Polygon extends RigidBody {
    constructor(vertices, type = Type.Dynamic, resetPosition = true) {
        super(type);
        this.vertices = vertices;
        for (let i = 0; i < this.count; i++) {
            this.centerOfMass.x += this.vertices[i].x;
            this.centerOfMass.y += this.vertices[i].y;
        }
        this.centerOfMass.x /= this.count;
        this.centerOfMass.y /= this.count;
        for (let i = 0; i < this.count; i++) {
            this.vertices[i].x -= this.centerOfMass.x;
            this.vertices[i].y -= this.centerOfMass.y;
        }
        if (!resetPosition)
            this.translate(this.centerOfMass);
        this.centerOfMass.clear();
    }
    get count() {
        return this.vertices.length;
    }
}
