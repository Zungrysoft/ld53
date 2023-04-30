export const data = {
    cratesRequired: 1,
    cratesDelivered: 0,
    cameraDistance: 6,
    cameraPosition: [2, 3, 0],
    cameraStartAngle: [Math.PI*(1/4), Math.PI*(1/8)],
    floorHeight: -3,
    elements: [
        // Final Track
        {
            type: 'conveyor',
            position: [2, 0, 1],
            color: 'red',
            angle: 1,
        },
        {
            type: 'conveyor',
            position: [3, 0, 1],
            color: 'red',
            angle: 1,
        },
        {
            type: 'conveyor',
            position: [4, 0, 1],
            color: 'red',
            angle: 1,
        },
        {
            type: 'conveyor',
            position: [5, 0, 1],
            color: 'red',
            angle: 1,
        },

        // Chute
        {
            type: 'chute',
            position: [6, 0, 1],
            letter: 'a',
        },

        // Goal Crate
        {
            type: 'crate',
            position: [2, 0, 2],
            letter: 'a',
        },

        // Platform
        {
            type: 'block',
            position: [1, 1, 0],
        },
        {
            type: 'block',
            position: [2, 1, 0],
        },
        {
            type: 'block',
            position: [3, 1, 0],
        },
        {
            type: 'block',
            position: [4, 1, 0],
        },
        {
            type: 'block',
            position: [1, 2, 0],
        },
        {
            type: 'block',
            position: [2, 2, 0],
        },
        {
            type: 'block',
            position: [3, 2, 0],
        },
        {
            type: 'block',
            position: [4, 2, 0],
        },

        // Laser
        {
            type: 'laser',
            position: [4, 4, 1],
            color: 'red',
            angle: 2,
        },
        {
            type: 'block',
            position: [4, 4, 0],
        },

        // Blocker Conveyor
        {
            type: 'conveyor',
            position: [0, 1, 0],
            color: 'blue',
            angle: 2,
        },
        {
            type: 'conveyor',
            position: [0, 2, 0],
            color: 'blue',
            angle: 2,
        },
        {
            type: 'conveyor',
            position: [0, 3, 0],
            color: 'blue',
            angle: 2,
        },
        {
            type: 'conveyor',
            position: [0, 4, 0],
            color: 'blue',
            angle: 2,
        },
        {
            type: 'conveyor',
            position: [0, 5, 0],
            color: 'blue',
            angle: 2,
        },
        {
            type: 'conveyor',
            position: [0, 6, 0],
            color: 'blue',
            angle: 2,
        },

        // Blocker Crates
        {
            type: 'crate',
            position: [0, 6, 1],
        },
        {
            type: 'crate',
            position: [0, 4, 1],
        },

        // Fans
        {
            type: 'block',
            position: [-1, 1, 0],
        },
        {
            type: 'block',
            position: [-1, 2, 0],
        },
        {
            type: 'fan',
            position: [-1, 1, 1],
            color: 'green',
            angle: 1,

        },
        {
            type: 'fan',
            position: [-1, 2, 1],
            color: 'green',
            angle: 1,
        },
    ],
}