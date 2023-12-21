import { useEffect, useState } from "react";

import { LogAllow } from "@_constants/global";
// @ts-ignore
import filesRef from "@_ref/rfrncs/Files.csv";
// @ts-ignore
import htmlRefElements from "@_ref/rfrncs/HTML Elements.csv";
import {
  TFilesReference,
  TFilesReferenceData,
  THtmlElementsReference,
  THtmlElementsReferenceData,
  THtmlReferenceData,
} from "@_types/main";

export const useReferenceData = () => {
  const [filesReferenceData, setFilesReferenceData] =
    useState<TFilesReferenceData>({});
  const [htmlReferenceData, setHtmlReferenceData] =
    useState<THtmlReferenceData>({
      elements: {},
    });

  // reference-files
  useEffect(() => {
    const _filesReferenceData: TFilesReferenceData = {};
    filesRef.map((fileRef: TFilesReference) => {
      _filesReferenceData[fileRef.Extension] = fileRef;
    });
    setFilesReferenceData(_filesReferenceData);
    LogAllow && console.info("files reference data: ", _filesReferenceData);
  }, []);
  // reference-html-elements
  useEffect(() => {
    const htmlElementsReferenceData: THtmlElementsReferenceData = {};
    htmlRefElements.map((htmlRefElement: THtmlElementsReference) => {
      const pureTag =
        htmlRefElement["Name"] === "Comment"
          ? "comment"
          : htmlRefElement["Tag"]?.slice(1, htmlRefElement["Tag"].length - 1);
      htmlElementsReferenceData[pureTag] = htmlRefElement;
    });
    setHtmlReferenceData({ elements: htmlElementsReferenceData });
    LogAllow &&
      console.info("html elements reference data: ", htmlElementsReferenceData);
  }, []);

  return {
    filesReferenceData,
    htmlReferenceData,
  };
};
