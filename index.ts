import PocketBase, { RecordService } from "pocketbase";

interface Article {
  title: string;
  url: string;
}

interface TypedPocketBase extends PocketBase {
  collection(idOrName: string): RecordService;
  collection(idOrName: "articles"): RecordService<Article>;
}

const pb = new PocketBase(
  "https://pocketbase.genieindex.ca"
) as TypedPocketBase;

type RandomWikipediaURLOptions = {
  language: string;
  wikipediaDomain: string;
  wikipediaProtocol: "http" | "https";
};

async function getRandomWikipediaURL(opts?: RandomWikipediaURLOptions) {
  let language;
  let wikipediaDomain;
  let wikipediaProtocol;

  if (opts) {
    language = opts.language;
    wikipediaDomain = opts.wikipediaDomain;
    wikipediaProtocol = opts.wikipediaProtocol;
  }

  if (!language) {
    language = "en";
  }

  let randomURL: URL;

  if (wikipediaDomain && wikipediaProtocol) {
    randomURL = new URL(
      `${wikipediaProtocol}://${wikipediaDomain}/wiki/Special:Random`
    );
  } else {
    randomURL = new URL(
      `https://${language}.wikipedia.org/wiki/Special:Random`
    );
  }

  const response = await fetch(randomURL, { method: "HEAD" });

  const url = new URL(response.url);

  return url;
}

async function queryPrettyWikipediaTitle(wikipediaURL: URL) {
  const response = await fetch(wikipediaURL);
  const html = await response.text();
  const titleTag = html.match(/<title>.*<\/title>/)?.[0];
  if (!titleTag)
    throw new Error(
      `Failed to extract title tag from provided Wikipedia URL: ${wikipediaURL}`
    );
  const title = titleTag
    .replace("<title>", "")
    .replace(" - Wikipedia</title>", "");
  return title;
}

async function writeData() {
  const randomURL = await getRandomWikipediaURL();
  const title = await queryPrettyWikipediaTitle(randomURL);

  console.log(`Trying to write ${title} (${randomURL})`);

  await pb.collection("articles").create({
    title,
    url: randomURL,
  });
}

setInterval(writeData, 1000);
