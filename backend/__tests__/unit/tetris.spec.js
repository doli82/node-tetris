const { generateRandomShape, rotateShape, createBoard, clearBoard } = require('../../src/tetris');

describe('Shapes', () => {
    it('should be generate a random shape', () => {
        const shape = generateRandomShape();
        
        expect(shape).toHaveProperty('data');
        expect(shape).toHaveProperty('freezed');
        expect(shape).toHaveProperty('position');

        expect(shape.data).toHaveLength(4);
        expect(shape.freezed).toBeFalsy();
        expect(shape.position).toHaveProperty('x');
        expect(shape.position).toHaveProperty('y');
    });

    it('should be rotate a shape', async () => {
        const shape = generateRandomShape();
        const rotatedShape = rotateShape(shape);
        
        expect(shape.freezed).toBe(rotatedShape.freezed);
        expect(shape.position).toBe(rotatedShape.position);
        expect(shape.data[0]).toEqual( rotatedShape.data.map(element => element[3] ) );
        expect(shape.data[1]).toEqual( rotatedShape.data.map(element => element[2] ) );
        expect(shape.data[2]).toEqual( rotatedShape.data.map(element => element[1] ) );
        expect(shape.data[3]).toEqual( rotatedShape.data.map(element => element[0] ) );
    });
});

describe('Board', () => {
    it('should be create a board 10 x 12', () => {
        const board = createBoard(10, 12);

        expect(board).toHaveLength(10);
        expect(board[0]).toHaveLength(12);        
    });

    it('shourl be clear a dirty board', () => {
        const board = [
            [2,2,2,2,4,4,4,4,5],
            [0,0,0,0,0,0,4,4,5],
            [2,2,2,2,0,0,4,4,5],
            [0,0,0,2,4,4,0,0,0],
            [2,2,2,2,4,4,0,0,0],
            [2,2,2,2,4,4,3,3,0],
            [4,4,2,2,4,4,0,3,0],
            [3,2,2,2,4,4,0,0,3],
            [2,4,2,2,4,4,0,0,3],
        ];
        const expected = createBoard(9, 9);
        
        expect(board).not.toEqual(expected);
        clearBoard( board );
        expect(board).toEqual(expected);
    });
});