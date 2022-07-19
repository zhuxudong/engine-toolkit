import { Component, Entity, MeshRenderer, Plane, PrimitiveMesh, Ray, Vector3 } from "oasis-engine";
import { Axis } from "./Axis";
import { GizmoComponent, AxisProps, axisNormal, axisIndices } from "./Type";
import { utils } from "./Utils";
export class TranslateControl extends Component implements GizmoComponent {
  private translateAxisComponent: { x: Axis; y: Axis; z: Axis; xy: Axis; xz: Axis; yz: Axis };
  private currAxis: string;
  private startPoint: Vector3 = new Vector3();
  private startPosition: Vector3 = new Vector3();
  private translateVector: Vector3 = new Vector3();
  private translateControlMap: {
    x: AxisProps;
    y: AxisProps;
    z: AxisProps;
    xy: AxisProps;
    xz: AxisProps;
    yz: AxisProps;
  };
  private selectedEntity: Entity = null;
  public gizmoEntity: Entity;
  public gizmoHelperEntity: Entity;
  private movePoint = new Vector3();

  constructor(entity: Entity) {
    super(entity);
    this.initAxis();
    this.createAxis(entity);
  }

  initAxis() {
    this.translateControlMap = {
      x: {
        name: "x",
        axisMesh: [utils.lineMesh, utils.axisArrowMesh, utils.axisArrowMesh],
        axisMaterial: utils.greenMaterial,
        axisHelperMesh: [utils.axisHelperLineMesh],
        axisRotation: [new Vector3(0, 0, -90), new Vector3(0, 0, -90), new Vector3(0, 0, 90)],
        axisTranslation: [new Vector3(0, 0, 0), new Vector3(1.5, 0, 0), new Vector3(-1.5, 0, 0)]
      },
      y: {
        name: "y",
        axisMesh: [utils.lineMesh, utils.axisArrowMesh, utils.axisArrowMesh],
        axisMaterial: utils.blueMaterial,
        axisHelperMesh: [utils.axisHelperLineMesh],
        axisRotation: [new Vector3(0, 90, 0), new Vector3(0, 0, 0), new Vector3(180, 0, 0)],
        axisTranslation: [new Vector3(0, 0, 0), new Vector3(0, 1.5, 0), new Vector3(0, -1.5, 0)]
      },
      z: {
        name: "z",
        axisMesh: [utils.lineMesh, utils.axisArrowMesh, utils.axisArrowMesh],
        axisMaterial: utils.redMaterial,
        axisHelperMesh: [utils.axisHelperLineMesh],
        axisRotation: [new Vector3(0, 90, 90), new Vector3(0, 90, 90), new Vector3(0, -90, 90)],
        axisTranslation: [new Vector3(0, 0, 0), new Vector3(0, 0, 1.5), new Vector3(0, 0, -1.5)]
      },
      xy: {
        name: "xy",
        axisMesh: [utils.axisPlaneMesh],
        axisMaterial: utils.lightRedMaterial,
        axisHelperMesh: [utils.axisHelperPlaneMesh],
        axisRotation: [new Vector3(0, 90, 90)],
        axisTranslation: [new Vector3(0.5, 0.5, 0)]
      },
      yz: {
        name: "yz",
        axisMesh: [utils.axisPlaneMesh],
        axisMaterial: utils.lightGreenMaterial,
        axisHelperMesh: [utils.axisHelperPlaneMesh],
        axisRotation: [new Vector3(90, 90, 0)],
        axisTranslation: [new Vector3(0, 0.5, 0.5)]
      },
      xz: {
        name: "xz",
        axisMesh: [utils.axisPlaneMesh],
        axisMaterial: utils.lightBlueMaterial,
        axisHelperMesh: [utils.axisHelperPlaneMesh],
        axisRotation: [new Vector3(0, 0, 0)],
        axisTranslation: [new Vector3(0.5, 0, 0.5)]
      }
    };
  }

  createAxis(entity: Entity) {
    this.gizmoEntity = entity.createChild("visible");
    this.gizmoHelperEntity = entity.createChild("invisible");
    const axisX = this.gizmoEntity.createChild("x");
    const axisY = this.gizmoEntity.createChild("y");
    const axisZ = this.gizmoEntity.createChild("z");
    const axisXY = this.gizmoEntity.createChild("xy");
    const axisXZ = this.gizmoEntity.createChild("xz");
    const axisYZ = this.gizmoEntity.createChild("yz");

    this.translateAxisComponent = {
      x: axisX.addComponent(Axis),
      y: axisY.addComponent(Axis),
      z: axisZ.addComponent(Axis),
      xy: axisXY.addComponent(Axis),
      yz: axisYZ.addComponent(Axis),
      xz: axisXZ.addComponent(Axis)
    };

    this.translateAxisComponent.x.initAxis(this.translateControlMap.x);
    this.translateAxisComponent.y.initAxis(this.translateControlMap.y);
    this.translateAxisComponent.z.initAxis(this.translateControlMap.z);
    this.translateAxisComponent.xy.initAxis(this.translateControlMap.xy);
    this.translateAxisComponent.xz.initAxis(this.translateControlMap.xz);
    this.translateAxisComponent.yz.initAxis(this.translateControlMap.yz);
  }

  onSelected(entity: Entity) {
    this.selectedEntity = entity;
  }

  onHoverStart(axis: string) {
    this.currAxis = axis;
    const currEntity = this.gizmoEntity.findByName(axis);
    const currComponent = currEntity.getComponent(Axis);
    currComponent.highLight();
  }

  onHoverEnd() {
    const currEntity = this.gizmoEntity.findByName(this.currAxis);
    const currComponent = currEntity.getComponent(Axis);
    currComponent.unLight();
  }

  onMoveStart(ray: Ray, axis: string) {
    this.currAxis = axis;
    this.startPosition = this.selectedEntity.transform.worldPosition.clone();
    let plane = new Plane(axisNormal[axis]);
    let tempDist = ray.intersectPlane(plane);
    ray.getPoint(tempDist, this.startPoint);

    // 变色
    const entityArray = this.gizmoEntity.children;
    for (let i = 0; i < entityArray.length; i++) {
      const currEntity = entityArray[i];
      const currComponent = currEntity.getComponent(Axis);
      if (currEntity.name === this.currAxis) {
        currComponent.yellow();
      } else {
        currComponent.gray();
      }
    }
  }
  onMove(ray: Ray): void {
    let plane = new Plane(axisNormal[this.currAxis]);
    let tempDist = ray.intersectPlane(plane);
    ray.getPoint(tempDist, this.movePoint);

    Vector3.subtract(this.movePoint, this.startPoint, this.translateVector);
    // 增量
    const currentPosition = this.selectedEntity.transform.worldPosition;
    this.selectedEntity.transform.worldPosition = this.addWithAxis(this.currAxis, currentPosition);
    console.log(this.movePoint);
    this.align(this.selectedEntity);
  }

  onMoveEnd() {
    const entityArray = this.gizmoEntity.children;
    for (let i = 0; i < entityArray.length; i++) {
      const currEntity = entityArray[i];
      const currComponent = currEntity.getComponent(Axis);
      currComponent.recover();
    }
  }

  align(entity: Entity) {
    this.entity.transform.worldPosition = entity.transform.worldPosition;
  }

  private addWithAxis(axis: string, out: Vector3): Vector3 {
    const currentAxisIndices = axisIndices[axis];
    let i = currentAxisIndices.length - 1;
    while (i >= 0) {
      const elementIndex = currentAxisIndices[i];
      out[elementIndex] = this.startPosition[elementIndex] + this.translateVector[elementIndex];
      i--;
    }
    return out;
  }
}