import { readdirSync, readFileSync, writeFileSync } from 'fs'
import { parseFile } from 'music-metadata'

interface IMusicInfo {
  title: string | undefined
  album: string | undefined
  artist: string | undefined
  name: string
  path: string
  cover: string | undefined
}

async function main() {
  const files = readdirSync('./public/music')

  const result: IMusicInfo[] = []
  for (let file of files) {
    let { common } = await parseFile(`./public/music/${file}`)

    let cover: string | undefined = undefined
    if (common?.picture?.length) {
      let item = common?.picture[0]
      cover = `data:${item.format};base64,${item.data.toString('base64')}`
    }

    result.push({
      name: file,
      path: `/music/${file}`,
      album: common?.album,
      title: common?.title,
      artist: common?.artist,
      cover,
    })
  }

  const dataFilePath = './public/data.json'
  const data = JSON.parse(readFileSync(dataFilePath).toString())
  data.musicList = result
  writeFileSync(dataFilePath, JSON.stringify(data, null, 2))
}

main()
