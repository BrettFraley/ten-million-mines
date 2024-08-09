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
// NOTE: TODO move mine gen functions here within gen field
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

    // Calls genRow and appends each row to the DOM
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

                // A single cell is highlighted, and the offset is -1, 0, or 1 
                // depending on if the cursor selected from the right or left side of the cell.
                const offsetRange =  selection.focusOffset - selection.anchorOffset || 0
                const singleCellSelected = [-1, 0 , 1].includes(offsetRange)
                
                if (singleCellSelected) {
                
                    // Decrement cellIndex if cell 0 is selected from the right (edge case)
                    let cellIndex = selection.anchorOffset
                    cellIndex -= offsetRange === -1 ? 1 : 0

                    // It's an 'undisturbed' "#" char
                     if (mineGame.selectionCharIs('#', selection, cellIndex)) {

                        const row = selection.baseNode.parentElement
                        const rowId = row.attributes.id.value.split('-')[0]

                        const isMine = mines[rowId].indexOf(cellIndex) > -1
                        mineGame.updateFieldRowCell(rowId, cellIndex, isMine)
                    }
                }
            }
        }, false)
    },

    // Replace char with * if mine or space if cleared.

    // TODO: call service with changed cell
    // TODO: potentially splitting and joining a 1000 char
    // or more string, so test with substr or alternate appraoches

    updateFieldRowCell: (rowId, idx, isMine) => {
        const newChar = isMine? "*" : "_"
        const row = dom.getEl(`${rowId}-mine-field-row`)
        let newRow = row.innerText.split('')
        newRow[idx] = newChar
        row.innerText = newRow.join('')
    },

    selectionCharIs(char, selection, index) {
        if (char && selection) {
            const validTextIndex = selection.anchorNode.wholeText !== undefined
            return validTextIndex ? selection.anchorNode.wholeText[index] === char : false
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

    // Generate the mine field data. 
    // NOTE: Going to ignore that there could be dupes, unimportant.
    generateMines: () => {
        let mines = mineGame.buildMineData()
        const totalMines = mineGame.getTotalMines(CONFIG)

        for (let i = 0; i < totalMines; i++) {
            const randRow = Math.floor(Math.random() * CONFIG.FIELD_ROW_COUNT)
            const randCell = Math.floor(Math.random() * CONFIG.FIELD_ROW_CELL_COUNT)
            mines[randRow].push(randCell)
        }

        return mines
    },

    buildMineData: () => {
        let rowStructure = {}

        for (let i = 0; i < CONFIG.FIELD_ROW_COUNT; i++) {
            rowStructure[`${i}`] = []
        }
        return rowStructure
    }

}

mineGame.init()
const mines = mineGame.generateMines()
