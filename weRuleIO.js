/****************************************************************************/
//this script is specifically designed to read from the message display div
//in the DOM, called "userConsole".
//it provides a backup system for this sloppy method of reading data sent
//accross the p2p network, by re-reading the entire contents of the userConsole
//and checking for {json} content that has not been evaluated.
/****************************************************************************/


var funkyUserConsoleCache = (function(){
    //this cache is only for strings with objects that have the property "legislation"
    var _contents = [];

    function _get(text){
        return (_contents.indexOf(text) > -1)? true : false;
    };

    function _set(text){
        _contents.push(text);
    };

    return {
        cachable: function(text){
            return (text.indexOf("legislation") > -1)? true : false;
        },
        get: function(text){
            if(this.cachable(text)){
                console.log("just checked a get in funky")
                return _get(text);
            }else{
                return false;
            }
        },
        set: function(text){
            if(this.cachable(text)){
                if(this.get(text) === false){
                    _set(text);
                    return true;
                }else{
                    return false;
                }
            }else{
                return false;
            }
        },
        checkDomForStrays: function(){
            console.log("checkDomForStrays()")
            return new Promise(function(resolve,reject){
                var i = 0;
                var j = [];
                var msg;
                while(userConsole.children[i] !== undefined){
                    msg = userConsole.children[i].innerHTML.substring(userConsole.children[i].innerHTML.indexOf(": ") + 2);
                    console.log("mesage from children",msg);
                    if(funkyUserConsoleCache.cachable(msg)){
                        if(funkyUserConsoleCache.get(msg) === false){
                            funkyUserConsoleCache.set(msg);
                            j[i] = processStrayLine(msg);
                        }
                    }
                    i++;
                }
                resolve(j);
            });
        }
    }
}());
var processStrayLine = function(line){
    var obj;
    return new Promise(function(resolve,reject){
        if(obj = IsValidLegislationJSONString(line)){
            // funkyUserConsoleCache.set(line);///this is only done when action is taken
            // console.log("object is valid",obj)
            //now have access to last peer message and can process as JSON object.
            //this should always spring an error when this client sees his own message.
            // so, first discard the action if the uid is the same as this user.
            if(obj.uid != undefined && obj.hash != undefined && obj.legislation == "1"){

                if(obj.uid === window.clientId){
                    console.log("user sees his own action and does nothing")
                    ///this action was already registered prior to being seen by this function
                    resolve(false);
                    return;
                }

                ///new legislation
                if(!Legislate.getItemByHash(obj.hash) && obj.vote == undefined){
                    Legislate.newLegislation(obj.proposer,obj.hash,obj.law);
                    funkyUserConsoleCache.set(line);
                    console.log("New legislation received")
                    resolve(false);
                    return;
                }

                //vote from voter
                if(obj.vote !== undefined && Legislate.getItemByHash(obj.hash)){
                    Legislate.receiveVote(obj);
                    funkyUserConsoleCache.set(line);
                    console.log("vote received from peer")
                    resolve(false);
                    return;
                }

                if(obj.receipt && Legislate.getItemByHash(obj.hash)){
                    console.log("receipt received for registered legislation")
                    resolve(false);
                    return;
                }

                console.log("message object was related to legislation, but not handled",obj)
                resolve(false);
                return;
                //new legislation, or,
                //vote
            }else{

                console.log("message received as legislation, but without correct object structure",obj)
                //no uid, so exit function
                resolve(false);
                return;
            }
        }
        console.log("string passed as legislation was not a valid string");
        resolve(false);
    })
}

var getLastPeerMessage = function(){
    var m = userConsole.lastElementChild.innerHTML;
    m = m.substring(m.indexOf(": ") + 2);
    window.processStrayLine(m).then((x)=>{
        return funkyUserConsoleCache.checkDomForStrays();
    });
};
/***************************************************/
///heres whats starts all the peer receiving action:
userConsole.onscroll = getLastPeerMessage;
// userConsole.onscroll = funkyUserConsoleCache.checkDomForStrays();
