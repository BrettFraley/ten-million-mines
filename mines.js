
// DOM Utils
const dom = {
    getEl: id => document.getElementById(id),
    createEl: type => document.createElement(type),
    appendEl: (parentId, el) => {
        let parent = dom.getEl(parentId)
        parent.appendChild(el)
    },
    getCursor: event => {
        return {
            x: event.clientX,
            y: event.clientY
        }
    }
}

// generateField returns a 'field' element
// containing  all rows and game 'cells'.
const generateField = config => {

    const buildRowCells = (amt) => {
        let rowStr = ""
        for (let i = 0; i < amt; i++) {
            rowStr += CONFIG.FIELD_CHAR
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
        // console.time()
        for (let i = 0; i < fieldSize; i++) {
            genRow(i) 
        }
        // console.timeEnd()
    }

    buildField(config.FIELD_ROW_COUNT)
    return dom.getEl('field')
}

// NOTE: Need to keep row cell count at 2000 or less..
const CONFIG = {
    FIELD_CHAR: "#",
    MINE_CHAR: "*",
    CLEAR_CHAR: "_",
    DIFUSED_CHAR: "!",
    KIT_CHAR: "$",
    FIELD_ROW_COUNT: 100,
    FIELD_ROW_CELL_COUNT: 100,
    MINE_DENSITY_PERCENTAGE: 20,
    KIT_DENSITY_PERCENTAGE: 10,
    DIFF_KITS: 5,
    LIVES: 5,
    GAME_SOURCE: 'client' // client or server switch
}

// DOM Elements
const beginButton = dom.getEl('load-field-button')
const welcomeMessage = dom.getEl('welcome-message')
const mineStats = dom.getEl('mine-stats')
const minesCleared = dom.getEl('mines-cleared')
const minesExploded = dom.getEl('mines-exploded')
const minesLeft = dom.getEl('mines-left')
const actionBox = dom.getEl('action-box')
const actionBoxContent = dom.getEl('action-box-content')
const clearActionButton = dom.getEl('clear-action-button')
const diffuseButton = dom.getEl('diffuse-button') 
const stepOffButton = dom.getEl('step-off-button')

// Event Listeners
beginButton.addEventListener('click', () => {
    welcomeMessage.style.display = 'none'
    beginButton.style.display = 'none'
    mineStats.style.display='block'
    mineGame.init()
}, false)

clearActionButton.addEventListener('click', () => {
    actionBox.style.display = 'none'
}, false)


const mineGame = {

    playerStats: {
        diffKits: CONFIG.DIFF_KITS,
        lives: CONFIG.LIVES,
        decision: ""
    },

    mineStats: {
        clearedAmt: 0, // not a mine, was cleared or difused
        explodedAmt: 0,
        leftAmt: 0
    },

    dialog: {
        diffKitMessage: () => {
            return `You have ${mineGame.playerStats.diffKits} diffusion kits.`
        },
        diffuseOrStepOffMessage: 'Difuse the mine, or take your chances and step off the mine!'

    },

    init: () => {

        let field = generateField(CONFIG)
        const mines = mineGame.generateMines()
        const kits = mineGame.generateKits()

        console.log(kits)

        diffuseButton.addEventListener('click', mineGame.diffuse, false)
        stepOffButton.addEventListener('click', mineGame.stepOff, false)
        
        field.addEventListener('click', e => {
            const selection = document.getSelection()
            const cursor = dom.getCursor(e)
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
                     if (mineGame.selectionCharIs(CONFIG.FIELD_CHAR, selection, cellIndex)) {

                        const row = selection.baseNode.parentElement
                        const rowId = row.attributes.id.value.split('-')[0]

                        const isMine = mines[rowId].indexOf(cellIndex) > -1
                        const isKit = kits[rowId].indexOf(cellIndex) > -1

                        mineGame.updateFieldRowCell(rowId, cellIndex, isMine, isKit, cursor)
                    }
                }
            }
        }, false)
    },

    // Replace char with * if mine or space if cleared.

    // TODO: call service with changed cell
    // TODO: potentially splitting and joining a 1000 char
    // or more string, so test with substr or alternate appraoches

    updateFieldRowCell: (rowId, idx, isMine, isKit, click) => {
        let newChar = isMine? CONFIG.MINE_CHAR : CONFIG.CLEAR_CHAR
        newChar = isKit? CONFIG.KIT_CHAR : CONFIG.KIT_CHAR

        const row = dom.getEl(`${rowId}-mine-field-row`)
        let newRow = row.innerText.split('')
        newRow[idx] = newChar
        row.innerText = newRow.join('')

        // stats
        if (isMine) {

            // if no diffusion kits, explode

            // TODO: If has diffusion kits, prompt for decision\
            // Should pause waiting decision to return
            const decision = mineGame.displayActionBox('mine', click.x, click.y)

            // console.log(`player chose: ${decision}`)
            // mineGame.playerStats.decision = "" // reset decision
            // Player hits mine. You have x diffusion kits.
            // Difuse the mine, or take your chances and step off it!
            // Difuse | Step Off
            
            // if diffuse
            // or if step off

            mineGame.mineStats.explodedAmt += 1
        }
        else if (isKit) {
            mineGame.displayActionBox('kit', click.x, click.y)
            mineGame.playerStats.diffKits += 1
        }
        else {
            mineGame.mineStats.clearedAmt += 1
        }
        mineGame.mineStats.leftAmt -= 1
        mineGame.updateMineStats()
    },

    updateMineStats: () => {
        minesCleared.innerText = `Cleared: ${mineGame.mineStats.clearedAmt}`
        minesExploded.innerText = `Exploded: ${mineGame.mineStats.explodedAmt}`
        minesLeft.innerText = `Left: ${mineGame.mineStats.leftAmt}` 
    },

    resetDecision: () => {
        console.log('reset: ')
        mineGame.playerStats.decision = ''
        console.log(`decision in reset: ${mineGame.playerStats.decision}`)
    },

    displayActionBox: (promptMode, x, y) => {
        // promptMode can be 'mine' or 'kit'
        // Mine: if has kits
        //      - diffuse or step off

        actionBox.style.display = "block"
        actionBox.style.position = "fixed"
        actionBox.style.left = `${x}px`
        actionBox.style.top = `${y}px`

        if (promptMode === 'kit') {
            mineGame.playerStats.diffKits += 1
            actionBoxContent.innerText = 
            `You discovered a diffusion kit!`
        }

        if (promptMode === 'mine') {
            actionBoxContent.innerText = 
            `${mineGame.dialog.diffKitMessage()} ` + 
            `${mineGame.dialog.diffuseOrStepOffMessage}`

            // TODO: handle this differently and account for
            // a decision never being made
            if (mineGame.playerStats.decision.length < 1) {
                let interval = setInterval(() => {
                    if (mineGame.playerStats.decision === 'diffuse') {
                        console.log('got diffuse')
                        console.log(interval)
                        clearInterval(interval)

                        return 'diffuse'
                    }
                    if (mineGame.playerStats.decision === 'stepOff') {
                        console.log('got stepOff')
                        clearInterval(interval)
                
                        return 'stepOff'
                    }
                }, 1000)
                mineGame.resetDecision()
            }
        }
        // if zero kits, explode => lives -= 1
        // click difuse or step off
    },

    explodeMine: () => {
        mineGame.mineStats.explodedAmt += 1
        mineGame.playerStats.lives -= 1
        
    },

    diffuse: () => {
      mineGame.playerStats.decision = 'diffuse'
      mineGame.playerStats.diffKits -= 1;
      mineGame.mineStats.clearedAmt += 1;
    },

    stepOff: () => {
        mineGame.playerStats.decision = 'stepOff'
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

    getTotalKits: config => {
        const availableCells = config.FIELD_ROW_COUNT * config.FIELD_ROW_CELL_COUNT
        const perc = config.KIT_DENSITY_PERCENTAGE / 100            
        return availableCells * perc
    },

    // Generate the mine field data. 
    // NOTE: Going to ignore that there could be dupes, unimportant.
    generateMines: () => {
        let mines = mineGame.prepRowStructure() // An empty mine-data structure
        const totalMines = mineGame.getTotalMines(CONFIG)
        mineGame.mineStats.leftAmt = totalMines

        for (let i = 0; i < totalMines; i++) {
            const randRow = Math.floor(Math.random() * CONFIG.FIELD_ROW_COUNT)
            const randCell = Math.floor(Math.random() * CONFIG.FIELD_ROW_CELL_COUNT)
            mines[randRow].push(randCell)
        }

        return mines
    },

    generateKits: () => {
        let kits = mineGame.prepRowStructure() // An empty mine-data structure
        const totalKits = mineGame.getTotalKits(CONFIG)

        for (let i = 0; i < totalKits; i++) {
            const randRow = Math.floor(Math.random() * CONFIG.FIELD_ROW_COUNT)
            const randCell = Math.floor(Math.random() * CONFIG.FIELD_ROW_CELL_COUNT)
            kits[randRow].push(randCell)
        }

        return kits
    },

    prepRowStructure: () => {
        let rowStructure = {}

        for (let i = 0; i < CONFIG.FIELD_ROW_COUNT; i++) {
            rowStructure[`${i}`] = []
        }
        return rowStructure
    }

}
