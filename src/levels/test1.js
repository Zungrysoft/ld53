export const data = {
    cratesRequired: 3,
    cratesDelivered: 0,
    cameraDistance: 5,
    cameraPosition: [1, 1, 0],
    cameraStartAngle: [Math.PI*(1/2), Math.PI*(1/4)],
    floorHeight: -10,
    elements: [
        {
            type: 'crate',
            position: [2, 1, 0],
            letter: 'a',
            angle: 0,
        },
        {
            type: 'crate',
            position: [2, 1, 1],
            letter: 'd',
            angle: 0,
        },
        {
            type: 'crate',
            position: [2, 1, 2],
            letter: 'e',
            angle: 0,
        },
        {
            type: 'crate',
            position: [0, 3, 0],
            letter: 'b',
            angle: 0,
        },
        {
            type: 'crate',
            position: [0, 4, 0],
            letter: 'c',
            angle: 0,
        },
        {
            type: 'conveyor',
            position: [0, -1, -1],
            color: 'blue',
            angle: 1,
        },
        {
            type: 'conveyor',
            position: [1, -1, -1],
            color: 'blue',
            angle: 1,
        },
        {
            type: 'conveyor',
            position: [2, -1, -1],
            color: 'blue',
            angle: 1,
        },
        {
            type: 'conveyor',
            position: [3, -1, -1],
            color: 'blue',
            angle: 1,
        },
        {
            type: 'chute',
            position: [4, -1, -1],
            letter: 'c',
        },
        {
            type: 'block',
            position: [3, -1, 1],
        },
        {
            type: 'conveyor',
            position: [0, 0, -1],
            color: 'blue',
            angle: 2,
        },
        {
            type: 'conveyor',
            position: [0, 1, -1],
            color: 'blue',
            angle: 2,
        },
        {
            type: 'conveyor',
            position: [0, 2, -1],
            color: 'blue',
            angle: 2,
        },
        {
            type: 'conveyor',
            position: [0, 3, -1],
            color: 'blue',
            angle: 2,
        },
        {
            type: 'conveyor',
            position: [0, 4, -1],
            color: 'blue',
            angle: 2,
        },
        {
            type: 'conveyor',
            position: [1, 1, -1],
            color: 'blue',
            angle: 3,
        },
        {
            type: 'conveyor',
            position: [2, 1, -1],
            color: 'blue',
            angle: 3,
        },
        {
            type: 'conveyor',
            position: [3, 1, -1],
            color: 'blue',
            angle: 3,
        },
        {
            type: 'block',
            position: [-3, 1, 0],
        },
        {
            type: 'fan',
            position: [-3, 1, 1],
            angle: 1,
            color: 'yellow',
        },
        {
            type: 'block',
            position: [4, 1, 0],
        },
    ],
}