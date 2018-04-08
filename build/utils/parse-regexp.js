export default function parseRegExp(re) {
  const lastSlashIndex = re.lastIndexOf('/')
  return new RegExp(re.substr(1, lastSlashIndex - 1), re.substr(lastSlashIndex + 1))
}
