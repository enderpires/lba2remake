import async from 'async';
import THREE from 'three';
import _ from 'lodash';

import {loadHqrAsync} from '../hqr';
import {loadTexture} from '../texture';
import {loadBody2} from './body2';
import {loadEntity2} from './entity';

import vertexShader from './shaders/model.vert.glsl';
import fragmentShader from './shaders/model.frag.glsl';

export default function(index, callback) {
    async.auto({
        ress: loadHqrAsync('RESS.HQR'),
        body: loadHqrAsync('BODY.HQR'),
        anim: loadHqrAsync('ANIM.HQR'),
        anim3ds: loadHqrAsync('ANIM3DS.HQR')
    }, function(err, files) {
        callback(loadModel(files, index));
    });
}

function loadModel(files, index) {
    const model = {
        files: files,
        palette: new Uint8Array(files.ress.getEntry(0)),
        entity: files.ress.getEntry(44)
    };

    const material = new THREE.RawShaderMaterial({
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        uniforms: {
            body: {value: loadTexture(model.files.ress.getEntry(6), model.palette)}
        }
    });

    const entities = loadEntity2(model.entity);
    const {positions, uvs, colors, linePositions, lineColors} = loadGeometry(model, index);

    const bufferGeometry = new THREE.BufferGeometry();
    bufferGeometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    bufferGeometry.addAttribute('uv', new THREE.BufferAttribute(new Uint8Array(uvs), 2, true));
    bufferGeometry.addAttribute('color', new THREE.BufferAttribute(new Uint8Array(colors), 4, true));

    const modelMesh = new THREE.Mesh(bufferGeometry, material);

    if (linePositions.length > 0) {
        const linebufferGeometry = new THREE.BufferGeometry();
        linebufferGeometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(linePositions), 3));
        linebufferGeometry.addAttribute('color', new THREE.BufferAttribute(new Uint8Array(lineColors), 4, true));

        const lineSegments = new THREE.LineSegments(linebufferGeometry, material);
        modelMesh.add(lineSegments);
    }

    return modelMesh;
}

function loadGeometry(model, index) {
    const geometry = {
        positions: [],
        uvs: [],
        colors: [],
        linePositions: [],
        lineColors: []
    };
    const objects = [];

    // TODO for each entity entry
    loadBody2(model, geometry, objects, index);

    // _.each(model.layout, section => {
    //     loadGround(island, section, geometry);
    //     loadObjects(island, section, geometry, objects);
    // });
    return geometry;
}
