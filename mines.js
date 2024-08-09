dom = {
    getEl: id => document.getElementById(id),
    createEl: type => document.createElement(type),
    appendEl: (parentId, el) => {
        let parent = dom.getEl(parentId)
        parent.appendChild(el)
    }
}
// generateField returns a 'field' element
// containing  all rows and game 'cells'
const generateField = config => {

    const buildRowCells = (amt) => {
        let rowStr = ""
        for (let i = 0; i < amt; i++) {
            rowStr += "#"
        }
        return rowStr
    }

    const genRow = rowNum => {
        let row = dom.createEl('span')
        row.className = "field-row"
        row.id = `${rowNum}-mine-field-row`
        row.innerText = buildRowCells(config.FIELD_ROW_CELL_COUNT)
        dom.appendEl('field', row)      
    }

    const buildField = fieldSize => {
        for (let i = 0; i < fieldSize; i++) {
            genRow(i)
        }
    }

    buildField(config.FIELD_ROW_COUNT)
    return dom.getEl('field')
}

const CONFIG = {
    FIELD_ROW_COUNT: 100,
    FIELD_ROW_CELL_COUNT: 100,
    MINE_DENSITY_PERCENTAGE: 20,
}

const mineGame = {
    init: () => {

        let field = generateField(CONFIG)
        
        field.addEventListener('click', () => {
            const selection = document.getSelection()
            // text in a row is highlighted    
            if (selection.type === "Range" || selection.type === "Caret") {

                // A single cell is highlighted, the offset is 1 or -1 
                // depending on if the cursor selected for the right or
                // the left side of the cell.
                const anchorOffset = selection.anchorOffset
                const focusOffset = selection.focusOffset
                const offsetRange =  focusOffset - anchorOffset || 0
                const singleCellSelected = offsetRange === 1 || offsetRange === -1
                
                // Only 1 cell is selected.
                if (singleCellSelected) {
                    
                    // If cell 0 is selected from the right the 
                    // offset will be off by 1, so decrement in this edge case.
                    let cellIndex = anchorOffset
                    cellIndex -= offsetRange === -1 ? 1 : 0

                    // It's an 'undistrurbed' "#" char
                     if (mineGame.selectionCharIs('#', selection, cellIndex)) {

                        let row = selection.baseNode.parentElement
                        let rowId = row.attributes.id.value.split('-')[0]

                        mineGame.updateFieldRowCell(rowId, cellIndex)
                    }
                }
            }
        }, false)

    },

    updateFieldRowCell: (rowId, idx) => {
        const row = dom.getEl(`${rowId}-mine-field-row`)
        let cur = row.innerText
        console.log("GOT:", cur[idx])
        // replace this row / splice in new char if mine or cleared
    },

    selectionCharIs(char, selection, index) {
        if (char && selection && selection.anchorNode) {
            console.log(index)
            console.log('char val:', selection.anchorNode.wholeText[index])
            return selection.anchorNode.wholeText[index] === char
        }
        else {
            throw Error(`Bad input to selectionCharIs:  char: ${char}, selection: ${selection}`)
        }
    },

    getTotalMines: config => {
        const availableCells = config.FIELD_ROW_COUNT * config.FIELD_ROW_CELL_COUNT
        const perc = config.MINE_DENSITY_PERCENTAGE / 100            
        return availableCells * perc
    },

    // When generating the mine field data,
    // discard duplicates if same cell gets assigned
    generateMines: () => {
        let mines = [];
        console.log('generate mines')
        const totalMines = mineGame.getTotalMines(CONFIG)
        for (let i = 0; i < totalMines; i++) {
            const randRow = Math.floor(Math.random() * CONFIG.FIELD_ROW_COUNT)
            const randCell = Math.floor(Math.random() * CONFIG.FIELD_ROW_CELL_COUNT)
            mines.push([randRow, randCell])

            // const mine = { row: randRow, cell: randCell } NOT YET...
        }

        console.log(mines)
    }
}

mineGame.init()
mineGame.generateMines()


// Sample / Dev / Test map of field..for mines..or other objects
// Real game field's will be served from server

// Stats at top: mines cleared, mines exploded, mines left...etc.

// Row <=  FIELD_ROW_COUNT
// Cell <= FIELD_ROW_CELL_COUNT

// TOTAL_AVAILABLE_CELLS = FIELD_ROW_COUNT * FIELD_ROW_CELL_COUNT

// Depending on the total available cells, what percentage of
// the field should contain mines? put this in config and play..
// Make a poll once I start telling people about this project!




// BACKBURNER TASK:
    // Buid in auto simulation of users and games,
    // particularly for end to end / load tests on SSE server











