
var tipNode:cc.Label;
export function showTips(tips:string){
    let parent = cc.director.getScene();
    if(! tipNode){
        let node  = new cc.Node()
        tipNode = node.addComponent(cc.Label);
        tipNode.fontSize = 40;
        node.color = cc.color(125,0,0);
    }
    if(tipNode){
        tipNode.node.setParent(parent);
        tipNode.node.opacity = 255;
        let label = tipNode;
        label.string = tips;
        cc.tween(tipNode.node).delay(1).to(0.3, {opacity:0}).start();
    }
}