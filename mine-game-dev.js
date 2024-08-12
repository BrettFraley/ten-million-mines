// INITIAL CONCLUSIONS 
// on string, array, and array of objects size vs performance
//------------------------
// NOTE: See info at bottom on SQLite max columns
// So far, it seems reasonable to do what I want
// to do with 10,000 char strings, but this should
// probably stay within the 2000 column SQLite default limit.
// This means 5,000 rows (spans) <- which I don't like
// containing 2,000 char strings for 10 million

// 10 Databases, 100 tables each = 1000 tables
// 1000 tables @ 1000 rows @ 10 columns = 10 million 'cells'

// 1000 tables @ 100 rows each @ 100 columns == 10 million cells

const createHugeString = (size, char) => {
    let hugeString = ""
    for (let i = 0; i < size; i++) {
        hugeString += char
    }
    return hugeString
}

// console.time()
// for (let i = 0; i < 10000; i++) {
//     createHugeString(10000, "A")
// }
// let t = console.timeEnd()

function testHugeStrings() {
    for (let i = 0; i < 1000; i++) {
        testString = createHugeString(10000, "!")
        let idx = Math.floor(Math.random() * 10000)
    }
}

// console.time()
// testHugeStrings()
// console.timeEnd()

function testHugeArrayOfEmptyObjects() {
    let arr = []
    for (let i = 0; i < 100000; i++) {
        const obj = {}
        arr.push(obj)
        let idx = Math.floor(Math.random() * 10000)
    }
    return arr
}

// console.time()
// testHugeArrayOfEmptyObjects()
// console.timeEnd()

// The default setting for SQLITE_MAX_COLUMN is 2000.
// You can change it at compile time to values as large as 32767.
// On the other hand, many experienced database designers will argue
// that a well-normalized database will never need more than 100 columns in a table.
