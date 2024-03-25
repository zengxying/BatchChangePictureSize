
import { Canvas2Image } from "./Canvas2Image";
const { ccclass, property } = cc._decorator;
import RenderTexture = cc.RenderTexture;
import SpriteFrame = cc.SpriteFrame;
import sys = cc.sys;
import { DomInputData } from "./DomInputData";
import { showTips } from "./Tool";

enum EditType {
    SCALE,
    SIZE,
    CLIP
}

@ccclass('Screenshot2D')
export class Screenshot2D extends cc.Component {


    @property(cc.Node)
    container: cc.Node = null!;




    rt: RenderTexture = null;

    _canvas: HTMLCanvasElement = null!;

    _buffer: ArrayBufferView = null!;



    pixArr: Uint8Array = new Uint8Array();

    sprites: cc.Sprite[];

    private _spScaleX: number = 1;
    private _spScaleY: number = 1;

    private _canvasArr: HTMLCanvasElement[] = [];
    private _canvasPool: HTMLCanvasElement[] = [];

    start() {
        this.rt = new RenderTexture();
        this.rt.getImpl();
        DomInputData.init(this.uploadOver.bind(this));
        Canvas2Image.resetZip();
    }

    uploadOver() {
        const parent = this.container;
        const files = DomInputData.files;
        const len = DomInputData.files.length;
        this.sprites = [];
        // this.textures = [];
        parent.destroyAllChildren();
        for (let index = 0; index < len; index++) {
            if (DomInputData.validFileType(files[index])) { //是资源
                const url = URL.createObjectURL(files[index])
                let nodeName = files[index].name;
                let pngtype = null;
                if (files[index].type == "image/jpeg") {
                    pngtype = { ext: '.jpg' };
                } else if (files[index].type == "image/png") {

                    pngtype = { ext: '.png' };
                }
                let node = new cc.Node(nodeName);
                let sp = node.addComponent(cc.Sprite);
                parent.addChild(node);
                this.sprites.push(sp);
                cc.assetManager.loadRemote(url, pngtype, (err: Error, res: cc.Asset) => {
                    if (err) {
                        console.error(err);
                    }
                    if (res instanceof cc.Texture2D) {
                        let sf = new cc.SpriteFrame(res);
                        sp.spriteFrame = sf;
                        node.width = res.width;
                        node.height = res.height;
                        this._setSpTrim(sp, this.isTrim);
                        // this.textures.push(res);
                    } else if (res instanceof cc.SpriteFrame) {
                        sp.spriteFrame = res;
                        node.width = res.getTexture().width;
                        node.height = res.getTexture().height;
                        this._setSpTrim(sp, this.isTrim);
                    } else {
                        console.warn("资源类型不对", res);
                    }
                    node.setScale(this._spScaleX, this._spScaleY);
                })
            }
        }
    }

    private isTrim: boolean = true;

    private editType: EditType = EditType.SCALE;
    private _setSpTrim(sp: cc.Sprite, isTrim: boolean) {
        sp.trim = isTrim;
        sp.sizeMode = isTrim ? cc.Sprite.SizeMode.TRIMMED : cc.Sprite.SizeMode.RAW;
    }

    onChangeEditorType(a: cc.Toggle) {
        // this.isScale = 
        switch (a.node.name) {
            case "toggle1":
                this.editType = EditType.SCALE;
                break;
            case "toggle2":
                this.editType = EditType.SIZE;
                break;
            case "toggle3":
                this.editType = EditType.CLIP;
                break;

            default:
                break;
        }

        console.log("editType:EditType = :" + this.editType);
    }

    onChangeEditorValue(value: string, editbox: cc.EditBox, customEventData: any) {
        switch (this.editType) {
            case EditType.SCALE:
                this.onChangeSpScale(value, editbox, customEventData);
                break;
            case EditType.SIZE:
                this.onChangeSpSize(value, editbox, customEventData);
                break;
            case EditType.CLIP:
                this.onChangeSpClip(value, editbox, customEventData);
                break;

        }
    }

    onChangeSpScale(value: string, editbox: cc.EditBox, customEventData: any) {
        const scale = parseFloat(value);
        if (isNaN(scale)) {
            showTips("请输入数字！！！！");
            return;
        }
        if (customEventData == "true") {
            this._spScaleX = scale;
        } else {
            this._spScaleY = scale;
        }
        this.sprites.forEach(sp => { 
            sp.type = cc.Sprite.Type.SIMPLE;
            sp.node.setScale(this._spScaleX, this._spScaleY); 
        });
    }

    onChangeSpSize(value: string, editbox: cc.EditBox, customEventData: any) {
        const size = parseFloat(value);
        if (isNaN(size)) {
            showTips("请输入数字！！！！");
            return;
        }
        this._spScaleX = 1;
        this._spScaleY = 1;

        let isWidth = customEventData == "true";
        let key = isWidth ? "width" : "height";
        this.sprites.forEach(sp => {
            sp.type = cc.Sprite.Type.SIMPLE;
            sp.node[key] = size;
            sp.node.setScale(this._spScaleX, this._spScaleY)
        });
    }

    onChangeSpClip(value: string, editbox: cc.EditBox, customEventData: any) {
        const size = parseFloat(value);
        if (isNaN(size)) {
            showTips("请输入数字！！！！");
            return;
        }
        this._spScaleX = 1;
        this._spScaleY = 1;

        let isWidth = customEventData == "true";
        let key = isWidth ? "width" : "height";
        this.sprites.forEach(sp => {
            sp.type = cc.Sprite.Type.TILED;
            sp.node[key] = size;
            sp.node.setScale(this._spScaleX, this._spScaleY)
        });
    }

    onSaveAll() {
        // let files = DomInputData.files;
        // for (let index = 0; index < files.length; index++) {
        //     const file = files[index];

        //     if (DomInputData.validFileType(file)) {
        //         let nodeName = file.name;
        //         nodeName = nodeName.substring(0, nodeName.lastIndexOf("."));
        //         this.canvas2image.fileDownload(URL.createObjectURL(file), file.type.replace("image/", ""), nodeName);
        //     }
        // }
        if (this._canvasArr.length) {
            this._canvasPool = this._canvasPool.concat(this._canvasArr);
        }

        console.time("保存资源---------");
        // console.log("贴图资源:", this.textures);
        Canvas2Image.toblobCount = this.sprites.length;
        this.sprites.forEach(sp => {
            this.__saveNode(sp.node);
        });
        Canvas2Image.blobOverCb = () => {
            Canvas2Image.saveZip();
            Canvas2Image.resetZip();
            this._canvasPool = this._canvasPool.concat(this._canvasArr);
            console.timeEnd("保存资源---------");
        }
    }

    /**
     * 获取像素数据
     * @param node 节点
     * @param flipY 垂直翻转数据
     */
    public getPixelsData(node: cc.Node, flipY: boolean = true) {
        if (!cc.isValid(node)) {
            return null;
        }

        // 节点宽高
        const width = Math.floor(Math.abs(node.width * node.scaleX)),
            height = Math.floor(Math.abs(node.height * node.scaleY));
        // 创建临时摄像机用于渲染目标节点
        const cameraNode = new cc.Node();
        cameraNode.parent = node;
        const camera = cameraNode.addComponent(cc.Camera);
        camera.clearFlags |= cc.Camera.ClearFlags.COLOR;
        camera.backgroundColor = cc.color(0, 0, 0, 0);
        camera.zoomRatio = cc.winSize.height / height;
        // 将节点渲染到 RenderTexture 中
        const renderTexture = new cc.RenderTexture();
        renderTexture.initWithSize(width, height, cc.RenderTexture.DepthStencilFormat.RB_FMT_S8);
        camera.targetTexture = renderTexture;
        camera.render(node);
        // 获取像素数据
        const pixelsData = renderTexture.readPixels();
        // 销毁临时对象并返回数据
        renderTexture.destroy();
        cameraNode.destroy();
        // 垂直翻转数据
        if (flipY) {
            const length = pixelsData.length,
                lineWidth = width * 4,
                data = new Uint8Array(length);
            for (let i = 0, j = length - lineWidth; i < length; i += lineWidth, j -= lineWidth) {
                for (let k = 0; k < lineWidth; k++) {
                    data[i + k] = pixelsData[j + k];
                }
            }
            return data;
        }
        return pixelsData;
    }

    private __saveNode(node: cc.Node) {

        this._buffer = this.getPixelsData(node, false);
        const width = Math.floor(Math.abs(node.width * node.scaleX)),
            height = Math.floor(Math.abs(node.height * node.scaleY));
        let arrayBuffer = this._buffer;
        if (sys.isBrowser) {
            let canvas: HTMLCanvasElement;
            if (this._canvasPool.length) {

                canvas = this._canvasPool.pop();
                this.clearCanvas(canvas);
            } else {

                canvas = document.createElement('canvas');
            }
            canvas.width = width;
            canvas.height = height;

            let ctx = canvas.getContext('2d')!;
            let rowBytes = width * 4;
            for (let row = 0; row < height; row++) {
                let sRow = height - 1 - row;
                let imageData = ctx.createImageData(width, 1);
                let start = sRow * width * 4;
                for (let i = 0; i < rowBytes; i++) {
                    imageData.data[i] = arrayBuffer[start + i];
                }
                ctx.putImageData(imageData, 0, row);
            }
            let idx = node.name.lastIndexOf(".");
            const type = node.name.substring(idx + 1);
            const filename = node.name.substring(0, idx);
            Canvas2Image.saveTexture(type, canvas, width, height, filename);
            this._canvasArr.push(canvas);
        } else if (sys.isNative) {



        }
    }

    // capture() {
    //     this.copyRenderTex();
    // }

    // saveRenderTexContent02(sp: cc.Sprite, fileName: string) {
    //     let node = sp.node;
    //     let texture = sp.spriteFrame.getTexture()
    //     if (texture) {
    //         //@ts-ignore
    //         this.rt.drawTextureAt(texture, 0, 0);
    //         this._buffer = this.rt.readPixels(null, 0, 0, texture.width, texture.height);
    //         let width = texture.width;
    //         let height = texture.height;
    //         let arrayBuffer = this._buffer;
    //         if (sys.isBrowser) {

    //             this._canvas = document.createElement('canvas');
    //             this._canvas.width = width;
    //             this._canvas.height = height;

    //             let ctx = this._canvas.getContext('2d')!;
    //             let rowBytes = width * 4;
    //             for (let row = 0; row < height; row++) {
    //                 let sRow = height - 1 - row;
    //                 let imageData = ctx.createImageData(width, 1);
    //                 let start = sRow * width * 4;
    //                 for (let i = 0; i < rowBytes; i++) {
    //                     imageData.data[i] = arrayBuffer[start + i];
    //                 }
    //                 ctx.putImageData(imageData, 0, row);
    //             }
    //             width = node.width * node.scaleX;
    //             height = node.height * node.scaleY;
    //             this.canvas2image.saveTexture("png", this._canvas, width, height, fileName);
    //         } else if (sys.isNative) {


    //         }

    //     }
    // }

    // saveRenderTexContent(sp: cc.Sprite, fileName: string) {
    //     let node = sp.node;
    //     const findUrl = sp.spriteFrame.getTexture().url;
    //     let texture = this.textures.find(t => t.url == findUrl);
    //     if (texture) {
    //         //@ts-ignore
    //         this.rt.drawTextureAt(texture, 0, 0);
    //         this._buffer = this.rt.readPixels(null, 0, 0, texture.width, texture.height);
    //         let width = texture.width;
    //         let height = texture.height;
    //         let arrayBuffer = this._buffer;
    //         if (sys.isBrowser) {

    //             this._canvas = document.createElement('canvas');
    //             this._canvas.width = width;
    //             this._canvas.height = height;

    //             let ctx = this._canvas.getContext('2d')!;
    //             let rowBytes = width * 4;
    //             for (let row = 0; row < height; row++) {
    //                 let sRow = height - 1 - row;
    //                 let imageData = ctx.createImageData(width, 1);
    //                 let start = sRow * width * 4;
    //                 for (let i = 0; i < rowBytes; i++) {
    //                     imageData.data[i] = arrayBuffer[start + i];
    //                 }
    //                 ctx.putImageData(imageData, 0, row);
    //             }
    //             width = node.width * node.scaleX;
    //             height = node.height * node.scaleY;
    //             this.canvas2image.saveTexture("png", this._canvas, width, height, fileName);
    //         } else if (sys.isNative) {


    //         }

    //     }
    // }



    clearCanvas(canvas: HTMLCanvasElement) {
        let ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}