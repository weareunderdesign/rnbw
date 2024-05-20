import * as prettier from "prettier/standalone";
import * as htmlParser from "prettier/plugins/html";

export const useElementHelper = () => {
  // Prettier supports code range formatting, but it is not supported by htmlParser.

  async function PrettyCode(code: string, startCol: number = 0) {
    let prettyCode = await prettier.format(code, {
      parser: "html",
      plugins: [htmlParser],
    });

    /*  When prettier receives the code, it formats it as independent code (as a separate file),
      and it does not take into account that you need to keep some initial tabs or spaces
      to make this code look formatted relative to the other code.
         
      The following code checks if the code starts with tabs/spaces and includes
      them in each line to make it consistent with the rest of the code.
      This code also checks for blank lines and removes them. 
      
      startCol - the position from which the line with the code begins. */

    if (startCol > 1) {
      const lines = prettyCode.split("\n");
      const nonEmptyLines = lines.filter((line) => !/^\s*$/.test(line));
      const spaces = " ".repeat(startCol - 1);

      const linesWithSpaces = nonEmptyLines.map((line, index) => {
        return index === 0 ? line : spaces + line;
      });

      prettyCode = linesWithSpaces.join("\n");
    }

    return prettyCode;
  }

  return { PrettyCode };
};
