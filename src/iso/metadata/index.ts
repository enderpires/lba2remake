import { loadMetadata } from './metadata';
import {
    initReplacements,
    processLayoutReplacement,
    buildReplacementMeshes
} from './replacements';
import { processLayoutMirror, buildMirrors } from './mirrors';
import { saveFullSceneModel } from './models';
import { loadGrid } from '../grid';
import { loadHqr } from '../../hqr';
import { loadImageData } from '..';
import { loadBricks } from '../bricks';

export async function extractGridMetadata(grid, entry, ambience, is3D) {
    if (!is3D) {
        return {
            replacements: { threeObject: null },
            mirrors: null
        };
    }
    const metadata = await loadMetadata(entry, grid.library);

    const replacements = await initReplacements(entry, metadata, ambience);
    const mirrorGroups = {};

    forEachCell(grid, metadata, (cellInfo) => {
        if (cellInfo.replace) {
            processLayoutReplacement(grid, cellInfo, replacements);
        }
        if (cellInfo.mirror) {
            processLayoutMirror(cellInfo, mirrorGroups);
        }
    });

    if (!replacements.threeObject) {
        replacements.threeObject = buildReplacementMeshes(entry, replacements);
    }

    return {
        replacements,
        mirrors: buildMirrors(mirrorGroups)
    };
}

export async function saveSceneReplacementModel(entry, ambience) {
    const [ress, bkg, mask] = await Promise.all([
        loadHqr('RESS.HQR'),
        loadHqr('LBA_BKG.HQR'),
        loadImageData('images/brick_mask.png')
    ]);
    const palette = new Uint8Array(ress.getEntry(0));
    const bricks = loadBricks(bkg);
    const grid = loadGrid(bkg, bricks, mask, palette, entry + 1);

    const metadata = await loadMetadata(entry, grid.library, true);
    const replacements = await initReplacements(entry, metadata, ambience);

    forEachCell(grid, metadata, (cellInfo) => {
        if (cellInfo.replace) {
            processLayoutReplacement(grid, cellInfo, replacements);
        }
    });

    if (!replacements.threeObject) {
        replacements.threeObject = buildReplacementMeshes(entry, replacements);
        saveFullSceneModel(replacements.threeObject, entry);
    }
}

function forEachCell(grid, metadata, handler) {
    let c = 0;
    for (let z = 0; z < 64; z += 1) {
        for (let x = 0; x < 64; x += 1) {
            const cell = grid.cells[c];
            const blocks = cell.blocks;
            for (let y = 0; y < blocks.length; y += 1) {
                if (blocks[y]) {
                    const layout = grid.library.layouts[blocks[y].layout];
                    if (layout && layout.index in metadata.layouts) {
                        handler({
                            ...metadata.layouts[layout.index],
                            layout,
                            pos: {x, y, z},
                            blocks
                        });
                    }
                }
            }
            c += 1;
        }
    }
}
