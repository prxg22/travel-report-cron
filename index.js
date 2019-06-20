const tr = require('travel-report')
const trc = require('travel-report-crawler')
const admin = require('firebase-admin')
const { Travel, Report } = tr(admin, { ref: '/chats/{chat_id}', params: { chat_id: '' }})

const config = {
  apiKey: process.env.API_KEY,
  authDomain: process.env.AUTH_DOMAIN,
  databaseURL: process.env.DATABASE_URL,
  projectId: process.env.PROJECT_ID,
  storageBucket: process.env.STORAGE_BUCKET,
  messagingSenderId: process.env.MESSAGING_SENDER_ID,
}

admin.initializeApp(config)

const createReport = async (chat_id, travel_id, travel) => {
  try {
    console.log('creating report...')
    const report = await trc(travel)
    return report
  } catch(e) {
      console.error(e)
  }
}

const reportTravel = async (snap) => {
  if (!snap.val()) return

  const chats = Object.entries(snap.val())
  for (let [chat_id , { travels }] of chats) {
    if (!travels) continue
    travels = Object.entries(travels)
    for (const [travel_id, travel] of (travels || [])) {
      try {
        const report = await createReport(chat_id, travel_id, travel)
        await Report.save(report, { chat_id, travel_id })
        console.log('report saved!')
        console.log(report)
      } catch(e) {
        console.error(e)
        continue
      }
    }
  }

}

const run = async () => {
  const snap = await admin.database().ref("/chats")
    .once('value')

  await reportTravel(snap)
  process.exit()
}

try {
  run()
} catch(e) {
  console.error(e)
  process.exit(1)
}
