import { Circle } from "./circle.js";
import { RigidBody } from "./rigidbody.js";
import { Matrix3, Vector2 } from "./math.js";
import { Polygon } from "./polygon.js";
import { Simplex } from "./simplex.js";
import { AABB } from "./detection.js";
import { Settings } from "./settings.js";

export class Renderer
{
    private gfx: CanvasRenderingContext2D;

    private cameraTransform!: Matrix3;
    private modelTransform!: Matrix3;
    private projectionTransform!: Matrix3;
    private viewportTransform!: Matrix3;
    private vpc!: Matrix3;

    constructor(gfx: CanvasRenderingContext2D)
    {
        this.gfx = gfx;
    }

    init(viewportTransform: Matrix3, projectionTransform: Matrix3, cameraTransform: Matrix3): void
    {
        this.viewportTransform = viewportTransform;
        this.projectionTransform = projectionTransform;
        this.cameraTransform = cameraTransform;
        this.vpc = this.viewportTransform.mulMatrix(this.projectionTransform).mulMatrix(this.cameraTransform);
    }

    // Mouse picking
    pick(screenPosition: Vector2): Vector2
    {
        let inv_vp = this.vpc.inverted();

        return inv_vp.mulVector2(screenPosition, 1.0);
    }

    log(content: any, line: number = 0): void
    {
        let y = 80 + line * 20;
        this.drawText(30, y, content);
    }

    setCameraTransform(cameraTransform: Matrix3)
    {
        this.cameraTransform = cameraTransform;
        this.vpc = this.viewportTransform.mulMatrix(this.projectionTransform).mulMatrix(this.cameraTransform);
    }

    setProjectionTransform(projectionTransform: Matrix3): void
    {
        this.projectionTransform = projectionTransform;
        this.vpc = this.viewportTransform.mulMatrix(this.projectionTransform).mulMatrix(this.cameraTransform);
    }

    setViewportTransform(viewportTransform: Matrix3): void
    {
        this.viewportTransform = viewportTransform;
        this.vpc = this.viewportTransform.mulMatrix(this.projectionTransform).mulMatrix(this.cameraTransform);
    }

    setModelTransform(modelTransform: Matrix3): void
    {
        this.modelTransform = modelTransform;
    }

    resetModelTransform(): void
    {
        this.modelTransform.loadIdentity();
    }

    drawCircle(x: number, y: number, radius: number = 0.05, filled: boolean = false): void
    {
        this.drawCircleV(new Vector2(x, y), radius, filled);
    }

    drawCircleV(v: Vector2, radius: number = 0.05, filled: boolean = false): void
    {
        let vpcm = this.vpc.mulMatrix(this.modelTransform);

        let tv = vpcm.mulVector2(v, 1);
        let tr = this.vpc.mulVector2(new Vector2(radius, 0), 0).x;

        this.gfx.lineWidth = 1;
        this.gfx.beginPath();
        this.gfx.arc(tv.x, Settings.height - tv.y, tr, 0, 2 * Math.PI);

        if (filled)
            this.gfx.fill();
        else
            this.gfx.stroke();
    }

    drawLine(x0: number, y0: number, x1: number, y1: number, lineWidth = 1): void
    {
        this.drawLineV(new Vector2(x0, y0), new Vector2(x1, y1), lineWidth);
    }

    drawLineV(v0: Vector2, v1: Vector2, lineWidth: number = 1): void
    {
        let vpcm = this.vpc.mulMatrix(this.modelTransform);

        let tv0 = vpcm.mulVector2(v0, 1);
        let tv1 = vpcm.mulVector2(v1, 1);

        this.gfx.lineWidth = lineWidth;
        this.gfx.beginPath();
        this.gfx.moveTo(tv0.x, Settings.height - tv0.y);
        this.gfx.lineTo(tv1.x, Settings.height - tv1.y);
        this.gfx.stroke();
    }

    drawText(x: number, y: number, content: any, fontSize = 20): void
    {
        this.gfx.font = fontSize + "px verdana";
        this.gfx.fillText(content, x, y);
    }

    // Draw vector from point p toward direction v
    drawVector(p: Vector2, v: Vector2, arrowSize: number = 0.03): void
    {
        this.drawLine(p.x, p.y, p.x + v.x, p.y + v.y);
        let n = new Vector2(-v.y, v.x).normalized().mul(3 * arrowSize);
        const nv = v.normalized();
        arrowSize *= 4;

        this.drawLine(p.x + v.x + n.x - nv.x * arrowSize, p.y + v.y + n.y - nv.y * arrowSize, p.x + v.x, p.y + v.y);
        this.drawLine(p.x + v.x - n.x - nv.x * arrowSize, p.y + v.y - n.y - nv.y * arrowSize, p.x + v.x, p.y + v.y);
    }

    // Draw p1 to p2 vector
    drawVectorP(p1: Vector2, p2: Vector2, arrowSize: number = 0.03): void
    {
        this.drawVector(p1, p2.sub(p1), arrowSize);
    }

    drawSimplex(sp: Simplex): void
    {
        switch (sp.count)
        {
            case 1:
                this.drawCircleV(sp.vertices[0], 0.1, false);
                break;
            case 2:
                this.drawLineV(sp.vertices[0], sp.vertices[1]);
                break;
            case 3:
                this.drawLineV(sp.vertices[0], sp.vertices[1]);
                this.drawLineV(sp.vertices[1], sp.vertices[2]);
                this.drawLineV(sp.vertices[2], sp.vertices[0]);
                break;
            default:
                break;
        }
    }

    drawBody(b: RigidBody, drawCenterOfMass: boolean = false, drawVerticesOnly: boolean = false, lineWidth: number = 1): void
    {
        this.setModelTransform(b.localToGlobal);

        let center = new Vector2(0, 0)

        if (b instanceof Polygon)
        {
            for (let i = 0; i < b.count; i++)
            {
                if (drawVerticesOnly)
                {
                    this.drawCircleV(b.vertices[i], 0.05, true);
                }
                else
                {
                    let curr = b.vertices[i];
                    let next = b.vertices[(i + 1) % b.count];
                    this.drawLineV(curr, next, lineWidth);
                }
            }
        }
        else if (b instanceof Circle)
        {
            this.drawCircleV(center, b.radius);
            this.drawLineV(center, new Vector2(b.radius, 0));
        }
        else
        {
            throw "Not supported shape";
        }

        if (drawCenterOfMass)
            this.drawCircleV(center, 0.01, true);

        this.resetModelTransform();
    }

    drawAABB(aabb: AABB, lineWidth = 1)
    {
        this.drawLine(aabb.min.x, aabb.min.y, aabb.min.x, aabb.max.y, lineWidth);
        this.drawLine(aabb.min.x, aabb.max.y, aabb.max.x, aabb.max.y, lineWidth);
        this.drawLine(aabb.max.x, aabb.max.y, aabb.max.x, aabb.min.y, lineWidth);
        this.drawLine(aabb.max.x, aabb.min.y, aabb.min.x, aabb.min.y, lineWidth);
    }
}
