// «Welches Paket passt?» mapping (brief Stage 2, item 11). Pure: used by the page and the tests.
// Any «nein» means Technik-Check; otherwise the topic picks the package.
const BY_TOPIC = { broken: 'quick', launch: 'launch', website: 'website', inbox: 'ki' };

export function pickPackage(topic, knows) {
  return knows === 'no' ? 'check' : BY_TOPIC[topic];
}
