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
    FIELD_ROW_CELL_COUNT: 100
}

const mineGame = {
    init: () => {
        let field = generateField(CONFIG)
        
        field.addEventListener('click', () => {
            const selection = document.getSelection()
            // text in a row is highlighted    
            if (!selection.isCollapsed) {

                ancOff = selection.anchorOffset
                focOff = selection.focusOffset

                // single cell is highlighted
                if (focOff - ancOff === 1) {
                    let row = selection.baseNode.parentElement
                    let rowId = row.attributes.id.value.split('-')[0]
                    console.log(rowId)
                    console.log(focOff)

                    mineGame.updateFieldRowCell(rowId, focOff)
                }

                
            }
        }, false)

    },

    updateFieldRowCell: (rowId, idx) => {
        const row = dom.getEl(`${rowId}-mine-field-row`)
        let cur = row.innerText
        console.log(typeof cur)
        console.log(cur[idx])
        row.innerText = cur
        
    }







}

mineGame.init()

// getSelection
// getSelection.baseNode.parentElement => 
        // will reference the row span,
        // which coontains the row ID

        // 25th row
        // selction.achorOffset is the start 
        // selection.focusOffset is end

// What if only cells within a row may be highlighted and cleared
// And as a group rows get cleared and eliminated
// Or something like only 2 or 3 may be cleared at a time
// Maybe there's a delay before you may clear your next
// cell or set of cells











