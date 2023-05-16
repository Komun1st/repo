 import * as YUKA from 'yuka';

let movingRight = false,
    movingLeft = false,
    movingForward = false,
    movingBack = false;

const camSpeed = 0.6;

let camera;
let camTarget;

let curSelectionMesh;

function getGrandParent(m) {
    if (m.parent === null || m.parent === undefined) {
        return m;
    } else
        return getGrandParent(m.parent);
}



export async function initScene(scene) {
    scene.clearColor = new BABYLON.Color3(0.0, 0.0, 0.0);
    camTarget = new BABYLON.TransformNode('camTarget', scene);
    camTarget.position = new BABYLON.Vector3(0, 0, 0);
    camera = new BABYLON.UniversalCamera("camera1", new BABYLON.Vector3(0, 15, -15), scene);
    camera.parent = camTarget;
    
    
    let light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    const ground = new BABYLON.MeshBuilder.CreateGround('ground', { width: 40, height: 40 }, scene);

    const m = new BABYLON.StandardMaterial();
    m.diffuseTexture = new BABYLON.Texture('textures/sand.jpg')
    m.diffuseTexture.uScale = 15;
    m.diffuseTexture.vScale = 15;
    ground.material = m;
    
   
   // scene.debugLayer.show();
    curSelectionMesh = BABYLON.MeshBuilder.CreateTorus('selection', { diameter: 2.2, thickness: 0.1, tessellation: 16 }, scene);
    let greenMat = new BABYLON.StandardMaterial();
    greenMat.diffuseColor = new BABYLON.Color3(0, 1, 0);
    greenMat.alpha = 0.5;
    curSelectionMesh.material = greenMat;
    curSelectionMesh.isVisible = false;

    let targetBox = BABYLON.MeshBuilder.CreateBox();
    targetBox.rotationQuaternion = null;
    targetBox.rotation.y = Math.PI;
    camera.lockedTarget = targetBox;
    scene.removeMesh(targetBox);
    targetBox.dispose();

    //начало новых танков WORLD OF TANKS 2.0
    let tankMeshes = await BABYLON.SceneLoader.ImportMeshAsync(null, "./models/","tank.glb",scene);
    let tankMesh = tankMeshes.meshes[0];
    tankMesh.rotationQuaternion = new BABYLON.Quaternion();

    let entityManager = new YUKA.EntityManager();
    let time = new YUKA.Time();

    let vehicle = new YUKA.Vehicle();
    entityManager.add(vehicle);
    //let vehicleBox = new BABYLON.MeshBuilder.CreateBox();
    vehicle.setRenderComponent(tankMesh, sync);
    vehicle.position = new YUKA.Vector3(0,0,0);
    vehicle.velocity = new YUKA.Vector3(5,0,8);
    vehicle.updateOrientation = true;
    vehicle.forward = new YUKA.Vector3(-1,0,0);
    

    let seekBh = new YUKA.SeekBehavior();
    vehicle.steering.add(seekBh);
    seekBh.active = true;
    seekBh.target = new YUKA.Vector3(-5,0,-8);

    let fleeBh = new YUKA.FleeBehavior();
    vehicle.steering.add(fleeBh);
    // левая кнопка запретить туда ехать
    scene.onPointerPick = (evt, info) => {
        if (evt.button == 0) {
            fleeBh.target = info.pickedPoint;
            fleeBh.active = true;
        }
        //Правая кнопка - послать его
        if (evt.button == 2) {
         seekBh.target = info.pickedPoint;
        }
    }
    
    scene.beforeRender = function () {
        updateCamPosition();
        const delta = time.update().getDelta();
        entityManager.update(delta);
    }
 
    setupEventListeners()
}



//Обработчики событий нажатия клавиш

function setupEventListeners(){
    window.addEventListener('keydown', keydown)

    function keydown(event) {
        switch (event.code) {
            case 'KeyW':
                movingForward = true; movingBack = false;
                break;
            case 'KeyA': movingLeft = true; movingRight = false; break;
            case 'KeyS': movingForward = false; movingBack = true; break;
            case 'KeyD': movingLeft = false; movingRight = true; break;
            case 'ShiftLeft': running = true; break;
        }
    }


    window.addEventListener('keyup', keyup)

    function keyup(event) {
        switch (event.code) {
            case 'KeyW': movingForward = false; break;
            case 'KeyA': movingLeft = false; break;
            case 'KeyS': movingBack = false; break;
            case 'KeyD': movingRight = false; break;
            case 'ShiftLeft': running = false; break;
        }
    }
    
}

//Функция управления камерой
function updateCamPosition() {
    let speed = camSpeed;
    let fwdVector = new BABYLON.Vector3(0, 0, 1);

    let leftVector = new BABYLON.Vector3(-1, 0, 0);

    if (movingForward) {
        camTarget.position.addInPlace(fwdVector.scale(speed));
    }

    if (movingBack) {

        camTarget.position.addInPlace(fwdVector.scale(-speed))
    }

    if (movingLeft) {
        camTarget.position.addInPlace(leftVector.scale(speed))
    }

    if (movingRight) {
        camTarget.position.addInPlace(leftVector.scale(-speed));
    }
}

//Функция для синхронизации сущности и объекта отрисовки
function sync(entity, renderComponent) {
    renderComponent.position.x=entity.position.x;
    renderComponent.position.y=entity.position.y;
    renderComponent.position.z=entity.position.z;
    if(renderComponent.hasOwnProperty('_rotationQuaternion')){
        renderComponent.rotationQuaternion.w=entity.rotation.w;
        renderComponent.rotationQuaternion.x=entity.rotation.x;
        renderComponent.rotationQuaternion.y=entity.rotation.y;
        renderComponent.rotationQuaternion.z=entity.rotation.z;
    }
}