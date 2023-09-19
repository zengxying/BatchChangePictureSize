// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import JSZip = require("jszip");

import FileSaver = require("file-saver");


const { ccclass, property } = cc._decorator;
const saveBlob = (blob, fileName) => {
    const a = document.createElement('a');
    a.style.display = 'none';
    const url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = fileName;
    a.click();
}


@ccclass('Canvas2Image')
export class Canvas2Image {
    static count = 0;
    static saveTexture(type: string, canvas, width: number, height: number, fileName: string) {
        console.log("调用次数" + ++Canvas2Image.count + " fileName" + fileName);
        switch (type) {
            case 'png':
                Canvas2Image.saveAsImage(canvas, width, height, 'png', fileName);
                break;
            case 'jpeg':
                Canvas2Image.saveAsImage(canvas, width, height, 'jpeg', fileName);
                break;
            case 'jpg':
                Canvas2Image.saveAsImage(canvas, width, height, 'jpg', fileName);
                break;
            case 'gif':
                Canvas2Image.saveAsImage(canvas, width, height, 'gif', fileName);
                break;
            case 'bmp':
                Canvas2Image.saveAsImage(canvas, width, height, 'bmp', fileName);
                break;
            case 'convertpng':
                Canvas2Image.convertToImage(canvas, width, height, 'png');
                break;
            case 'convertjpeg':
                Canvas2Image.convertToImage(canvas, width, height, 'jpeg');
                break;
            case 'convertgif':
                Canvas2Image.convertToImage(canvas, width, height, 'gif');
                break;
            case 'convertbmp':
                Canvas2Image.convertToImage(canvas, width, height, 'bmp');
                break;
            default:
                console.warn("没有图片类型")
                break;
        }
    }
    // check if support sth.
    static $support = function(){
        var canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d');

        return {
            canvas: !!ctx,
            imageData: !!ctx.getImageData,
            dataURL: !!canvas.toDataURL,
            btoa: !!window.btoa
        };
    }();

    static downloadMime = 'image/octet-stream';

    static blobOverCb:Function;

    static scaleCanvas(canvas, width, height) {
        var w = canvas.width,
            h = canvas.height;
        if (width == undefined) {
            width = w;
        }
        if (height == undefined) {
            height = h;
        }

        var retCanvas = document.createElement('canvas');
        var retCtx = retCanvas.getContext('2d');
        retCanvas.width = width;
        retCanvas.height = height;
        console.log("错误的图片数据：", w, h, 0, 0, width, height)
        retCtx.drawImage(canvas, 0, 0, w, h, 0, 0, width, height);
        return retCanvas;
    }

    static getDataURL(canvas, type, width, height) {
        canvas = Canvas2Image.scaleCanvas(canvas, width, height);
        return canvas.toDataURL(type);
    }

    static saveFile(strData, type, fileName) {
        // document.location.href = strData;
        Canvas2Image.fileDownload(strData, type, fileName);
    }

    static genImage(strData) {
        var img = document.createElement('img');
        img.src = strData;
        return img;
    }
    static fixType(type) {
        type = type.toLowerCase().replace(/jpg/i, 'jpeg');
        var r = type.match(/png|jpeg|bmp|gif/)[0];
        return 'image/' + r;
    }
    static encodeData(data) {
        if (!window.btoa) { throw 'btoa undefined' }
        var str = '';
        if (typeof data == 'string') {
            str = data;
        } else {
            for (var i = 0; i < data.length; i++) {
                str += String.fromCharCode(data[i]);
            }
        }

        return btoa(str);
    }
    static getImageData(canvas) {
        var w = canvas.width,
            h = canvas.height;
        return canvas.getContext('2d').getImageData(0, 0, w, h);
    }
    static makeURI(strData, type) {
        return 'data:' + type + ';base64,' + strData;
    }


    /**
     * create bitmap image
     * 按照规则生成图片响应头和响应体
     */
    static genBitmapImage(oData) {

        //
        // BITMAPFILEHEADER: http://msdn.microsoft.com/en-us/library/windows/desktop/dd183374(v=vs.85).aspx
        // BITMAPINFOHEADER: http://msdn.microsoft.com/en-us/library/dd183376.aspx
        //

        var biWidth = oData.width;
        var biHeight = oData.height;
        var biSizeImage = biWidth * biHeight * 3;
        var bfSize = biSizeImage + 54; // total header size = 54 bytes

        //
        //  typedef struct tagBITMAPFILEHEADER {
        //  	WORD bfType;
        //  	DWORD bfSize;
        //  	WORD bfReserved1;
        //  	WORD bfReserved2;
        //  	DWORD bfOffBits;
        //  } BITMAPFILEHEADER;
        //
        var BITMAPFILEHEADER = [
            // WORD bfType -- The file type signature; must be "BM"
            0x42, 0x4D,
            // DWORD bfSize -- The size, in bytes, of the bitmap file
            bfSize & 0xff, bfSize >> 8 & 0xff, bfSize >> 16 & 0xff, bfSize >> 24 & 0xff,
            // WORD bfReserved1 -- Reserved; must be zero
            0, 0,
            // WORD bfReserved2 -- Reserved; must be zero
            0, 0,
            // DWORD bfOffBits -- The offset, in bytes, from the beginning of the BITMAPFILEHEADER structure to the bitmap bits.
            54, 0, 0, 0
        ];

        //
        //  typedef struct tagBITMAPINFOHEADER {
        //  	DWORD biSize;
        //  	LONG  biWidth;
        //  	LONG  biHeight;
        //  	WORD  biPlanes;
        //  	WORD  biBitCount;
        //  	DWORD biCompression;
        //  	DWORD biSizeImage;
        //  	LONG  biXPelsPerMeter;
        //  	LONG  biYPelsPerMeter;
        //  	DWORD biClrUsed;
        //  	DWORD biClrImportant;
        //  } BITMAPINFOHEADER, *PBITMAPINFOHEADER;
        //
        var BITMAPINFOHEADER = [
            // DWORD biSize -- The number of bytes required by the structure
            40, 0, 0, 0,
            // LONG biWidth -- The width of the bitmap, in pixels
            biWidth & 0xff, biWidth >> 8 & 0xff, biWidth >> 16 & 0xff, biWidth >> 24 & 0xff,
            // LONG biHeight -- The height of the bitmap, in pixels
            biHeight & 0xff, biHeight >> 8 & 0xff, biHeight >> 16 & 0xff, biHeight >> 24 & 0xff,
            // WORD biPlanes -- The number of planes for the target device. This value must be set to 1
            1, 0,
            // WORD biBitCount -- The number of bits-per-pixel, 24 bits-per-pixel -- the bitmap
            // has a maximum of 2^24 colors (16777216, Truecolor)
            24, 0,
            // DWORD biCompression -- The type of compression, BI_RGB (code 0) -- uncompressed
            0, 0, 0, 0,
            // DWORD biSizeImage -- The size, in bytes, of the image. This may be set to zero for BI_RGB bitmaps
            biSizeImage & 0xff, biSizeImage >> 8 & 0xff, biSizeImage >> 16 & 0xff, biSizeImage >> 24 & 0xff,
            // LONG biXPelsPerMeter, unused
            0, 0, 0, 0,
            // LONG biYPelsPerMeter, unused
            0, 0, 0, 0,
            // DWORD biClrUsed, the number of color indexes of palette, unused
            0, 0, 0, 0,
            // DWORD biClrImportant, unused
            0, 0, 0, 0
        ];

        var iPadding = (4 - ((biWidth * 3) % 4)) % 4;

        var aImgData = oData.data;

        var strPixelData = '';
        var biWidth4 = biWidth << 2;
        var y = biHeight;
        var fromCharCode = String.fromCharCode;

        do {
            var iOffsetY = biWidth4 * (y - 1);
            var strPixelRow = '';
            for (var x = 0; x < biWidth; x++) {
                var iOffsetX = x << 2;
                strPixelRow += fromCharCode(aImgData[iOffsetY + iOffsetX + 2]) +
                    fromCharCode(aImgData[iOffsetY + iOffsetX + 1]) +
                    fromCharCode(aImgData[iOffsetY + iOffsetX]);
            }

            for (var c = 0; c < iPadding; c++) {
                strPixelRow += String.fromCharCode(0);
            }

            strPixelData += strPixelRow;
        } while (--y);

        var strEncoded = Canvas2Image.encodeData(BITMAPFILEHEADER.concat(BITMAPINFOHEADER)) + Canvas2Image.encodeData(strPixelData);

        return strEncoded;
    };

    static toblobCount: number = 0;
    /**
     * saveAsImage
     * @param canvasElement
     * @param {String} image type
     * @param {Number} [optional] png width
     * @param {Number} [optional] png height
     */
    static saveAsImage(canvas, width, height, type, fileName, iszip: boolean = true) {
        /**
         * canvas.toBlob 的第三个参数。当请求图片格式为image/jpeg或者image/webp时用来指定图片展示质量。
         * 如果这个参数的值不在指定类型与范围之内，则使用默认值，其余参数将被忽略。
         * 此处暂时默认设置为 1
         */
        var quality = 1.0;
        if (Canvas2Image.$support.canvas && Canvas2Image.$support.dataURL) {
            if (typeof canvas == "string") { canvas = document.getElementById(canvas); }
            if (type == undefined) { type = 'png'; }
            type = Canvas2Image.fixType(type);
            if (/bmp/.test(type)) {
                var data = Canvas2Image.getImageData(Canvas2Image.scaleCanvas(canvas, width, height));
                var strData = Canvas2Image.genBitmapImage(data);
                Canvas2Image.saveFile(Canvas2Image.makeURI(strData, Canvas2Image.downloadMime), type.replace("image/", ""), fileName);
            } else {

                canvas = Canvas2Image.scaleCanvas(canvas, width, height);
                // 如果
                canvas.toBlob(function (blob) {
                    Canvas2Image.toblobCount--;
                    if (iszip) {
                        Canvas2Image.pushFile(blob, type.replace("image/", ""), fileName);
                    } else {
                        var url = URL.createObjectURL(blob);
                        Canvas2Image.saveFile(url, type.replace("image/", ""), fileName);
                    }
                    console.log("Canvas2Image.toblobCount:"+Canvas2Image.toblobCount);
                    if (!Canvas2Image.toblobCount) {
                        Canvas2Image.blobOverCb&& Canvas2Image.blobOverCb()
                    }
                }, type, quality)
            }
        }
    }

    static convertToImage(canvas, width, height, type) {
        if (Canvas2Image.$support.canvas && Canvas2Image.$support.dataURL) {
            if (typeof canvas == "string") { canvas = document.getElementById(canvas); }
            if (type == undefined) { type = 'png'; }
            type = Canvas2Image.fixType(type);

            if (/bmp/.test(type)) {
                var data = Canvas2Image.getImageData(Canvas2Image.scaleCanvas(canvas, width, height));
                let strData = Canvas2Image.genBitmapImage(data);
                return Canvas2Image.genImage(Canvas2Image.makeURI(strData, 'image/bmp'));
            } else {
                let strData: string = Canvas2Image.getDataURL(canvas, type, width, height);
                return Canvas2Image.genImage(strData);
            }
        }
    };

    static fileDownload(downloadUrl, type, fileName) {
        let aLink = document.createElement('a');
        aLink.style.display = 'none';
        aLink.href = downloadUrl;
        aLink.download = fileName + "." + type;


        // 触发点击-然后移除
        document.body.appendChild(aLink);
        aLink.click();
        document.body.removeChild(aLink);
    }
    static zip:JSZip;
    static img: JSZip;
    static resetZip() {
        Canvas2Image.zip = new JSZip();
        Canvas2Image.img = Canvas2Image.zip.folder("images");
    }

    static saveZip() {
        Canvas2Image.zip.generateAsync({ type: "blob" }).then(function (content) {
            // see FileSaver.js
            var file = new File([content], "example.zip");
            FileSaver.saveAs(file);
        });
    }

    static pushFile(blob, type, fileName) {
        Canvas2Image.img.file(fileName + "." + type, blob);
    }





}