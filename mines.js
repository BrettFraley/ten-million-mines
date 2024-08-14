
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
    },
    getBodyWidth: () => document.body.clientWidth
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

const CONFIG = {
    FIELD_CHAR: "#",
    MINE_CHAR: "*",
    CLEAR_CHAR: "_",
    DIFUSED_CHAR: "!",
    KIT_CHAR: "$",
    FIELD_ROW_COUNT: 1000,
    FIELD_ROW_CELL_COUNT: 100,
    MINE_DENSITY_PERCENTAGE: 20,
    KIT_DENSITY_PERCENTAGE: 10,
    DIFF_KITS: 5,
    LIVES: 5,
    GAME_SOURCE: 'client',
    DEV_SERVER_URL: 'localhost:8080/connect'
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
        decision: "",
        messageCount: 0
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

    hasKits: () => mineGame.playerStats.diffKits > 0,
    resetDecision: () => mineGame.playerStats.decision = '',

    // SSE connection with retry logic every 2 secs for 3 tries
    connect: () => {
        let events = new EventSource('http://localhost:8080/connect');
        events.onerror = e => {
            const retry = 3
            let tries = 0

            if (events.readyState === 0) {
                
                const retryInterval = setInterval(() => {
                    if (events.readyState === 0 && tries < retry) {
                        tries += 1
                    }
                    if (events.readyState === 0 && tries === retry) {
                        events.close() // TODO: UI notification
                        clearInterval(retryInterval)
                        throw Error(`${e}: Issue connecting to mine game SSE server at /connect`)
                    }
                }, 2000)
            }
        }
        // TODO: change to onmessage, onclosed, etc.
        if (events.readyState) {
            events.addEventListener('mine_feed', event => {
                mineGame.playerStats.messageCount += 1;
                console.log('Message Count: ', mineGame.playerStats.messageCount)
                console.log('received:', event.data)
            }, false)
        }   
    },

    init: () => {
        mineGame.connect()

        let field = generateField(CONFIG)
        const mines = mineGame.generateMines()
        const kits = mineGame.generateKits()

        diffuseButton.addEventListener('click', mineGame.diffuse, false)
        stepOffButton.addEventListener('click', mineGame.stepOff, false)
        
        // Text in a row is highlighted or clicked.
        field.addEventListener('click', e => {
            const selection = document.getSelection()
            const cursor = dom.getCursor(e)
            
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

                        let isMine = mines[rowId].indexOf(cellIndex) > -1
                        const isKit = kits[rowId].indexOf(cellIndex) > -1

                        // hack to fix
                        isMine = isMine && !isKit
                        mineGame.updateFieldRowCell(rowId, cellIndex, isMine, isKit, cursor)
                    }
                }
            }
        }, false)
    },

    updateFieldRowCell: (rowId, idx, isMine, isKit, click) => {

        const newChar = isMine ? CONFIG.MINE_CHAR :
                        isKit ? CONFIG.KIT_CHAR :
                        CONFIG.CLEAR_CHAR

        if (!mineGame.hasKits) {
            mineGame.explodeMine()
        }
        else if (isMine) {
            mineGame.displayActionBox('mine', click.x, click.y)
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

        const row = dom.getEl(`${rowId}-mine-field-row`)
        let newRow = row.innerText.split('')
        newRow[idx] = newChar
        row.innerText = newRow.join('')
    },

    updateMineStats: () => {
        minesCleared.innerText = `Cleared: ${mineGame.mineStats.clearedAmt}`
        minesExploded.innerText = `Exploded: ${mineGame.mineStats.explodedAmt}`
        minesLeft.innerText = `Left: ${mineGame.mineStats.leftAmt}` 
    },

    displayDecisionButtons: show => {
        const displayVal = show ? 'inline-block' : 'none'
        diffuseButton.style.display = displayVal
        stepOffButton.style.display = displayVal
    },

    // Display action box pop up.
    // promptMode can be 'mine' or 'kit'
    displayActionBox: (promptMode, x, y) => {

        // If action box X > 2/3 * 2 of screen, subtract action box width 
        x -= x > (Math.floor(dom.getBodyWidth() / 3) * 2) ? 300 : 0

        actionBox.style.display = "block"
        actionBox.style.position = "fixed"
        actionBox.style.left = `${x}px`
        actionBox.style.top = `${y}px`

        // DEBUG: haven't triggered this yet
        if (promptMode === 'kit') {
            mineGame.displayDecisionButtons(false)
            mineGame.playerStats.diffKits += 1
            actionBoxContent.innerText = 
            `You discovered a diffusion kit!`
        }

        else if (promptMode === 'mine') {
            mineGame.displayDecisionButtons(true)

            actionBoxContent.innerText = 
            `${mineGame.dialog.diffKitMessage()} ` + 
            `${mineGame.dialog.diffuseOrStepOffMessage}`

            // TODO: Account for case of a decision never being made
            if (mineGame.playerStats.decision.length < 1) {

                let interval = setInterval(() => {
                    const decision = mineGame.playerStats.decision
                    clearInterval(interval)
                    mineGame.resetDecision()
                    return decision
                }, 1000)
            }
        }

    },

    explodeMine: () => {
        mineGame.mineStats.explodedAmt += 1
        mineGame.playerStats.lives -= 1
        // animate explosion
    },

    diffuse: () => {
      mineGame.playerStats.decision = 'diffuse'
      mineGame.playerStats.diffKits -= 1;
      mineGame.mineStats.clearedAmt += 1;
      actionBox.style.display = 'none'
    },

    // TODO: Implement step off logic
    stepOff: () => {
        mineGame.playerStats.decision = 'stepOff'
        actionBox.style.display = 'none'
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
