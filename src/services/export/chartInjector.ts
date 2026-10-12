import JSZip from 'jszip';

/**
 * Generates the OpenXML chart XML for the 3D Clustered Column Chart:
 * "Zendesk Audit Analysis by Business Rules"
 * Color: Green #6AA84F
 * Background: Dark Charcoal #434343
 */
function buildChartXml(endRow: number, maxAxisVal: number): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<c:chartSpace xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:mv="urn:schemas-microsoft-com:mac:vml" xmlns:c14="http://schemas.microsoft.com/office/drawing/2007/8/2/chart"><c:chart><c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:pPr lvl="0"><a:defRPr b="0" i="1" sz="2200"><a:solidFill><a:schemeClr val="lt1"/></a:solidFill><a:latin typeface="Arial"/></a:defRPr></a:pPr><a:r><a:rPr b="0" i="1" sz="2200"><a:solidFill><a:schemeClr val="lt1"/></a:solidFill><a:latin typeface="Arial"/></a:rPr><a:t>Zendesk Audit Analysis by Business Rules</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title><c:view3D><c:rotX val="15"/><c:rotY val="20"/><c:depthPercent val="100"/><c:rAngAx val="1"/></c:view3D><c:plotArea><c:layout/><c:bar3DChart><c:barDir val="col"/><c:grouping val="clustered"/><c:varyColors val="0"/><c:ser><c:idx val="0"/><c:order val="0"/><c:tx><c:strRef><c:f>Audit!$L$1</c:f></c:strRef></c:tx><c:spPr><a:solidFill><a:srgbClr val="6AA84F"/></a:solidFill><a:ln cmpd="sng"><a:noFill/></a:ln></c:spPr><c:invertIfNegative val="0"/><c:dLbls><c:numFmt formatCode="General" sourceLinked="1"/><c:txPr><a:bodyPr/><a:lstStyle/><a:p><a:pPr lvl="0"><a:defRPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:latin typeface="Roboto"/></a:defRPr></a:pPr></a:p></c:txPr><c:showLegendKey val="0"/><c:showVal val="1"/><c:showCatName val="0"/><c:showSerName val="0"/><c:showPercent val="0"/><c:showBubbleSize val="0"/></c:dLbls><c:cat><c:strRef><c:f>Audit!$K$2:$K$${endRow}</c:f></c:strRef></c:cat><c:val><c:numRef><c:f>Audit!$L$2:$L$${endRow}</c:f><c:numCache/></c:numRef></c:val></c:ser><c:axId val="1368769270"/><c:axId val="497177530"/></c:bar3DChart><c:catAx><c:axId val="1368769270"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="b"/><c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:pPr lvl="0"><a:defRPr b="0" sz="1800"><a:solidFill><a:schemeClr val="lt1"/></a:solidFill><a:latin typeface="Arial"/></a:defRPr></a:pPr><a:r><a:rPr b="0" sz="1800"><a:solidFill><a:schemeClr val="lt1"/></a:solidFill><a:latin typeface="Arial"/></a:rPr><a:t>Business Rule </a:t></a:r></a:p></c:rich></c:tx><c:layout><c:manualLayout><c:xMode val="edge"/><c:yMode val="edge"/><c:x val="0.15236328125"/><c:y val="0.8945744680851063"/></c:manualLayout></c:layout><c:overlay val="0"/></c:title><c:numFmt formatCode="General" sourceLinked="1"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:spPr><a:ln><a:noFill/></a:ln></c:spPr><c:txPr><a:bodyPr/><a:lstStyle/><a:p><a:pPr lvl="0"><a:defRPr b="0"><a:solidFill><a:schemeClr val="lt1"/></a:solidFill><a:latin typeface="Arial"/></a:defRPr></a:pPr></a:p></c:txPr><c:crossAx val="497177530"/></c:catAx><c:valAx><c:axId val="497177530"/><c:scaling><c:orientation val="minMax"/><c:max val="${maxAxisVal.toFixed(1)}"/><c:min val="0.0"/></c:scaling><c:delete val="0"/><c:axPos val="l"/><c:majorGridlines><c:spPr><a:ln><a:solidFill><a:srgbClr val="B7B7B7"/></a:solidFill></a:ln></c:spPr></c:majorGridlines><c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:pPr lvl="0"><a:defRPr b="0" sz="1800"><a:solidFill><a:schemeClr val="lt1"/></a:solidFill><a:latin typeface="Arial"/></a:defRPr></a:pPr><a:r><a:rPr b="0" sz="1800"><a:solidFill><a:schemeClr val="lt1"/></a:solidFill><a:latin typeface="Arial"/></a:rPr><a:t>Count</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title><c:numFmt formatCode="General" sourceLinked="1"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:spPr><a:ln><a:noFill/></a:ln></c:spPr><c:txPr><a:bodyPr/><a:lstStyle/><a:p><a:pPr lvl="0"><a:defRPr b="0"><a:solidFill><a:schemeClr val="lt1"/></a:solidFill><a:latin typeface="Arial"/></a:defRPr></a:pPr></a:p></c:txPr><c:crossAx val="1368769270"/></c:valAx></c:plotArea><c:plotVisOnly val="1"/></c:chart><c:spPr><a:solidFill><a:srgbClr val="434343"/></a:solidFill></c:spPr></c:chartSpace>`;
}

const DRAWING1_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:cx="http://schemas.microsoft.com/office/drawing/2014/chartex" xmlns:cx1="http://schemas.microsoft.com/office/drawing/2015/9/8/chartex" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:dgm="http://schemas.openxmlformats.org/drawingml/2006/diagram" xmlns:x3Unk="http://schemas.microsoft.com/office/drawing/2010/slicer" xmlns:sle15="http://schemas.microsoft.com/office/drawing/2012/slicer"><xdr:oneCellAnchor><xdr:from><xdr:col>0</xdr:col><xdr:colOff>266700</xdr:colOff><xdr:row>0</xdr:row><xdr:rowOff>180975</xdr:rowOff></xdr:from><xdr:ext cx="9629775" cy="5095875"/><xdr:graphicFrame><xdr:nvGraphicFramePr><xdr:cNvPr id="1340843095" name="Chart 1" title="Chart"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr><xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart r:id="rId1"/></a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData fLocksWithSheet="0"/></xdr:oneCellAnchor></xdr:wsDr>`;

const DRAWING1_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="../charts/chart1.xml"/></Relationships>`;

const SHEET1_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/></Relationships>`;

/**
 * Injects OpenXML chart & drawing parts into an XLSX zip buffer.
 * Targets the 'Audit' sheet (Sheet 1) to replicate the 3D Bar Chart
 * from the example audit report workbook.
 */
export async function injectChartIntoWorkbook(
  rawBuffer: ArrayBuffer | Uint8Array,
  ruleCount: number = 13,
  maxCount: number = 421
): Promise<Uint8Array> {
  const zip = await JSZip.loadAsync(rawBuffer);

  const endRow = Math.max(ruleCount + 1, 2);
  const maxAxisVal = Math.max(Math.ceil((maxCount * 1.1) / 50) * 50, 100);

  // 1. Add chart XML
  zip.file('xl/charts/chart1.xml', buildChartXml(endRow, maxAxisVal));

  // 2. Add drawing XML & rels
  zip.file('xl/drawings/drawing1.xml', DRAWING1_XML);
  zip.file('xl/drawings/_rels/drawing1.xml.rels', DRAWING1_RELS);

  // 3. Connect sheet 1 to drawing 1
  const existingSheet1Rels = zip.file('xl/worksheets/_rels/sheet1.xml.rels');
  if (existingSheet1Rels) {
    let relsXml = await existingSheet1Rels.async('text');
    if (!relsXml.includes('Target="../drawings/drawing1.xml"')) {
      relsXml = relsXml.replace(
        '</Relationships>',
        '<Relationship Id="rIdChartDrawing" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/></Relationships>'
      );
      zip.file('xl/worksheets/_rels/sheet1.xml.rels', relsXml);
    }
  } else {
    zip.file('xl/worksheets/_rels/sheet1.xml.rels', SHEET1_RELS);
  }

  // 4. Reference drawing in sheet1.xml
  const sheet1File = zip.file('xl/worksheets/sheet1.xml');
  if (sheet1File) {
    let sheet1Xml = await sheet1File.async('text');
    if (!sheet1Xml.includes('<drawing')) {
      sheet1Xml = sheet1Xml.replace('</worksheet>', '<drawing r:id="rId1"/></worksheet>');
      zip.file('xl/worksheets/sheet1.xml', sheet1Xml);
    }
  }

  // 5. Register content types
  const contentTypesFile = zip.file('[Content_Types].xml');
  if (contentTypesFile) {
    let ctXml = await contentTypesFile.async('text');
    let overridesToAdd = '';
    if (!ctXml.includes('PartName="/xl/drawings/drawing1.xml"')) {
      overridesToAdd += '<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>';
    }
    if (!ctXml.includes('PartName="/xl/charts/chart1.xml"')) {
      overridesToAdd += '<Override PartName="/xl/charts/chart1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>';
    }
    if (overridesToAdd) {
      ctXml = ctXml.replace('</Types>', `${overridesToAdd}</Types>`);
      zip.file('[Content_Types].xml', ctXml);
    }
  }

  return await zip.generateAsync({ type: 'uint8array' });
}

/**
 * Downloads a binary buffer as a file in the browser,
 * or safely no-ops in Node environments (e.g. unit tests).
 */
export function triggerFileDownload(
  data: Uint8Array | ArrayBuffer,
  filename: string
): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const blob = new Blob([data as any], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
