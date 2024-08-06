dom = {
    getEl: id => document.getElementById(id),
    createEl: type => document.createElement(type),
    appendEl: (parentId, el) => {
        let parent = dom.getEl(parentId)
        parent.appendChild(el)
    }
}

const generateField = config => {

    const field = dom.getEl('field')

    // TODO: Put cell count, and other config for testing
    // and dev in config
    const CELL_COUNT = 10000
    const ROWS = 100
    const XWIDTH = 100


    const buildRowCells = (amt, rowId, row) => {
        let cellElements = dom.createEl()
        for (let i = 0; i < amt; i++) {
            const pre = dom.createEl('pre')
            pre.className = "field-cell"
            pre.innerText = "#"
            pre.id = `${rowId}_${i}`
            row.appendChild(pre)
        }
    }

    const genRow = rowNum => {
        let row = dom.createEl('span')
        row.className = "field-row"
        row.id = `${rowNum}-mine-field-row`
        dom.appendEl('field', row)
        buildRowCells(XWIDTH, rowNum, row)
        
    }

    // generate 100 spans with innerText of 100 \w
    const buildField = fieldSize => {
        for (let i = 0; i < fieldSize; i++) {
            genRow(i)
        }
    }

    buildField(100)
}

generateField()
