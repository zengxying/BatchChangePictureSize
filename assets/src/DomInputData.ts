const fileTypes = [
    "image/apng",
    "image/bmp",
    "image/gif",
    "image/jpeg",
    "image/pjpeg",
    "image/png",
    "image/svg+xml",
    "image/tiff",
    "image/webp",
    "image/x-icon",
];
export class DomInputData {

    public static preview: HTMLElement;

    public static files:File[];
    private static cb:Function;

    public static init(cb:Function) {
        this.cb = cb;
        // 创建包含文件夹选择的 div 元素
        const folderDiv = document.getElementById("GameDiv");

        // 创建文件夹选择的 input 元素
        const input = document.createElement('input');
        input.type = 'file';
        input.webkitdirectory = true;
        input.addEventListener('change', this.selectFolder.bind(this));
        input.style.position = "absolute"; // 绝对定位
        input.style.bottom = "200"; // 距离底部的距离为 0
        input.style.left = "0"; // 左侧对齐
        // 创建预览信息的 div 元素
        const preview = document.createElement('div');
        preview.id = 'preview';
        preview.innerHTML = '<p>No files currently selected for upload</p>';
        preview.style.position = "absolute"; // 绝对定位
        preview.style.top = "0"; // 距离底部的距离为 0
        preview.style.left = "0"; // 左侧对齐
        // 将子元素添加到包含文件夹选择的 div 元素中
        folderDiv.appendChild(input);
        folderDiv.appendChild(preview);
        this.preview = preview;
    }


    public static selectFolder(e) {
        console.log(e);
        //文件夹里面所有文件        
        var files = e.target.files;
        this.files = files;
        //文件夹名称        
        var relativePath = files[0].webkitRelativePath;
        var folderName = relativePath.split("/")[0];
        console.log(files);
        //文件信息转换成FormData结构遍历上传        
        // for (var i = 0; i < files.length; i++) {
        //     var formData = new FormData();
        //     formData.append('file', files[i])
        //     //上传            
        // }
        // this.updateImageDisplay(files);
        this.cb && this.cb();
    }



    public static validFileType(file) {
        return fileTypes.includes(file.type);
    }

    public static returnFileSize(number) {
        if (number < 1024) {
            return `${number} bytes`;
        } else if (number >= 1024 && number < 1048576) {
            return `${(number / 1024).toFixed(1)} KB`;
        } else if (number >= 1048576) {
            return `${(number / 1048576).toFixed(1)} MB`;
        }
    }



    public static updateImageDisplay(files) {
        while (this.preview.firstChild) {
            this.preview.removeChild(this.preview.firstChild);
        }

        const curFiles = files;
        if (curFiles.length === 0) {
            const para = document.createElement("p");
            para.textContent = "No files currently selected for upload";
            this.preview.appendChild(para);
        } else {
            const list = document.createElement("ol");
            this.preview.appendChild(list);

            for (const file of curFiles) {
                const listItem = document.createElement("li");
                const para = document.createElement("p");
                if (this.validFileType(file)) {
                    para.textContent = `File name ${file.name}, file size ${this.returnFileSize(
                        file.size,
                    )}.`;
                    const image = document.createElement("img");
                    image.src = URL.createObjectURL(file);

                    listItem.appendChild(image);
                    listItem.appendChild(para);
                } else {
                    para.textContent = `File name ${file.name}: Not a valid file type. Update your selection.`;
                    listItem.appendChild(para);
                }

                list.appendChild(listItem);
            }
        }
    }
}

