import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "$",
  textNodeName: "_",
  isArray: (name) => name === "item",
});

export function parseXML(xml: string) {
  return parser.parse(xml);
}
