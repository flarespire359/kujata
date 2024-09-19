const padNumber = (num, length) => {
  const str = String(num) // Convert number to string
  return str.padStart(length, ' ') // Pad with spaces
}
const sleep = ms => new Promise(r => setTimeout(r, ms))
module.exports = { padNumber, sleep }
