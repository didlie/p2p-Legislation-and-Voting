//BOOK interface functions:
/**
gPeer has the peer list of connected peers from IO.js
gPeer[i].peerId must always have the same gPeer[i].dataChannel.label






**/
//classes for the application: legislation
// Solution to getting the data from the network!!
//1) watch the new messages::
/***************************************************/
/***************************************************/
/** legislation initiated by this user *************/
var proposition = function(p){
    console.log(p);
    p = b64EncodeUnicode(p.trim());
    safeSha1(p).then(function(hash){
        // window.lastHash = hash;
        //decoded with atob();
        var propString = btoa(p);
        console.log(hash,p,propString)
        console.log(atob(propString));
        console.log(b64DecodeUnicode(atob(propString)))
        console.log(hash,window.clientId,p)
        Legislate.newLegislation(window.clientId,hash,propString);
    })
}
                                /////////////////////////////////////////////////////////////////////////////////
                                // From website: https://codeblogmoney.com/validate-json-string-using-javascript/
                                /////////////////////////////////////////////////////////////////////////////////
                                function IsValidLegislationJSONString(str) {
                                    try {
                                        //altered to return the parsed object
                                        console.log("not valid?",j)

                                        var j = JSON.parse(str.trim());

                                        if(j.legislation === undefined) throw new Exeption("Not legit action");
                                        // console.log("not valid?",j)
                                    } catch (e) {
                                        return false;
                                    }
                                    return j;
                                }
                                /////////////////////////////////////////////////////////////////////////////////

var Legislate = (function(){
    var _legislation = [];
    var _proposer = [];
    var _network = [];
    var _votes = [];//object peerId#, hash of _law, vote
    var _state = [];
    var _received = [];
    ///Uses global gPeer
    // must be updated for each instance of new legislation
    function _registerNewLegislation(proposer,hash1,encodedTxt){
        return new Promise(function(resolve,reject){
            // console.log("1 - _registerNewLegislation:  text:: ",encodedTxt);
            //voters are received internally from global gPeer
            ////////////////////////////////////////////////////////////////////////////////////////
            //Important !!! each peer registers new legislation with only her own connected peers!!
            //the final decision on the legislation is made only based on the users connected peers at the time of receiving or creating the legislation !!!
            //this may be useful as a feature!!!
            //this may need to be upgraded to a more comprehensive _network definition!!!
            ///////////////////////////////////////////////////////////////////////////////////////
            var voters = _voters();
            voters.push(window.clientId)
            // var me = this;
            var txt = atob(encodedTxt);
            var _privTxt = encodedTxt;
            console.log("after atob",txt);
            safeSha1(txt).then(function(hash2){
                // console.log(hash1,hash2);
                if(hash1 !== hash2){
                    console.log("ERROR: illegal submission of unhashed legislation");
                    resolve(false)
                    return;
                }
                if(_legislation[hash1] !== undefined){
                    console.log("ERROR: this legislation was already submitted");
                    resolve(false)
                    return;
                }

                voters.forEach(function(member){
                    _network.push(member);
                    // console.log("_registerNewLegislation : _network",_network)
                });

                _legislation[hash2] = _privTxt;
                // console.log("_legislation",_legislation);
                _votes[hash2] = {voters:[],totals:{yea:0,nay:0}};//voters is [] because no votes have been received
                _network[hash2] = voters;
                _proposer[hash1] = proposer;
                ///////////////////////////////////////////////////////////////////////////////////
                //when all the members of the network have confirmed the receipt of the legislation, by returning a
                //...receipt, the status is changed to "pending", and is ready to receive votes,
                //...then the status can change to either "passed", or "failed", based on the tally
                ///////////////////////////////////////////////////////////////////////////////////
                // _state[hash2] = "new";
                /***********************************/
                /** BOOK.... send out to all peers */
                /***********************************/
                // console.log("proposer:",proposer,"clientId:",clientId);//this is ok
                if(proposer === window.clientId){
                    //clientId is window.clientId
                    //type:msg is required by the BOOK network
                    IO.doSay(JSON.stringify({legislation:1,proposer:proposer,uid:clientId,hash:hash1,law:encodedTxt}));
                    //in case network is compromised by the drop-out of a peer, the legislation state is "canceled";
                }else{
                    //this is for sending the receipt
                    //use IO.send2peer(peerId,object)


                    //clientId = window.clientId
                    //type:msg is required by the BOOK network
                    //IO.doSay(JSON.stringify({legislation:1,proposer:proposer[0],uid:clientId,hash_received:hash1}))
                }
                resolve(hash1);
            });
        });
    };// requires the _voters function below
    /***************/
    //BOOK interface
    /***************/
                        function _voters(){
                            var vtrs = [];
                            gPeer.forEach(function(p){
                                vtrs.push(p.peerId);
                            });
                            return vtrs;
                        };

    //votes :: {legislation:1,proposer:proposer,hash:hash,text:text,uid:peerId,vote:vote}
    //input.legislation
    //input.proposer
    //input.hash
    //input.uid
    //input.txt
    //input.vote
    /**** BOOK interface, input must also have a type property! ***/
    /**** the type property must be defined in IO.switch ***/
    //
    //
    //
    /** Solution!!! ***/
    /** document.getElementById("console").onscroll = function(){
    var message = this.lastElementChild.innerHTML.substring(2);//removes the " : " at the begining of the string
    //then validate the message as JSON and see if it has the properties neccessary for this application
}
    */
//
//
//
//
    ////////////////////////////////////////////////////////////////
    function _recordVotes(json){
        return new Promise(function(resolve,reject){

            // console.log("json in recordVotes",json)
            var input = JSON.parse(json);
            //check that the voter is valid
            if(_network.indexOf(input.uid) < 0){
                console.log("ERROR: invalid voting member");
                resolve(false)
                return false;
            }
            //check if the voter voted//
            if( _votes[input.hash].voters[input.uid] !== undefined){
                    // console.log(_votes[input.hash]);
                    console.log("ERROR: this member already voted");
                    resolve(false)
                    return false;
                }
            //check that the legislation exists, because all members can only vote after the legislation is fully distributed
            if(_legislation[input.hash] === undefined){
                console.log("ERROR: this legislation was not registered");
                //!!!!  the legislation must be distributed before any vote can be received.
                resolve(false)
                return false;
            }
            //check that the hash of the legislation is the same as the registered hash
            //ansinc hashing opperation required
            safeSha1(atob(input.text)).then(function(hash){
                if(hash !== input.hash){
                    console.log(hash,input.hash,"ERROR: bad vote hash");
                    resolve(false)
                    return;// this return is just to stop the script, vote tally will still be displayed
                }else{
                    ///////////////////////////////////////
                    //if the script continues here, vote is recorded,
                    //vote must also be sent.
                    ///////////////////////////////////////
                    //record the users vote
                    _votes[input.hash].voters[input.uid] = input.vote;
                    //increment the vote count
                    _votes[input.hash].totals[input.vote] =
                        (_votes[input.hash].totals === undefined || _votes[input.hash].totals[input.vote] === undefined)? 1 : _votes[input.hash].totals[input.vote] + 1;
                        // console.log(_votes)//moved to higher function
                    /**************************************/
                    /****** send vote to every other peer */
                    /**************************************/
                    /**** BOOK interface * IO global ******/
                    //first, the main.js voter id must be the same as the window.clientId for the vote to be relayed.
                    ///.... this is because received votes are processed in this function also, but not relayed
                    if(input.uid === window.clientId){
                        // console.log(input);
                        input.proposer = _proposer[input.hash];
                        input.legislation = 1;
                        // input.legislation = 1;
                        IO.doSay(JSON.stringify(input));//may move this to a higher level???, but require async sha1 validation
                    }
                    resolve(input.hash);
                    /**************************************/
                    /**************************************/
                };
            });
        });
    };

    function _tallyVotes(hash){
        var temp;
        //////////////////////////////////////////
        //when majority is achieved on yea or nay,
        //the legislation is pass or failed
        //////////////////////////////////////////
        //check vote totals to see if a conclusion has been reached
        if(_votes[hash].totals.yea > _network[hash].length/2){
            //passed
            _state[hash] = "passed";
            window.view_area.innerHTML = "<u>LEGISLATION:</u><BR>" + Legislate.getItemByHash(hash);
            endProp();

        }else if(_votes[hash].totals.nay >= _network[hash].length/2){
            //failed
            _state[hash] = "failed"
            window.view_area.innerHTML = "<u>LEGISLATION:</u><BR>" + Legislate.getItemByHash(hash);
            endProp();
        }else{
            _state[hash] = "pending";
        }
        temp = _state[hash];
        return {hash: hash, status: temp};
    };
/********* available public functions *****************/
    return {
        viewLaw: function(hash){
            if(_votes[hash].voters[window.clientId] != undefined){
                window.view_area3.innerHTML = "&check;";
                window.view_area.innerHTML = "You voted on this issue.<br>";
                // window.view_area.innerHTML += "<br>----Legislation----<br>" + Legislate.getItemByHash(hash);
                Legislate.outputView(hash);
                return;
            }
            //display voting form
            window.view_area.innerHTML = "You have not yet voted.<br>";
            // window.view_area.innerHTML += "<br>----Legislation----<br>" + Legislate.getItemByHash(hash);
            Legislate.outputView(hash)
            window.showFromRecord(hash);
        },
        newLegislation: function(proposer,hash,encodedTxt){

                _registerNewLegislation(proposer,hash,encodedTxt).then((hash)=>{
                    if(hash === false) return;
                    window.hasProp(Legislate.getItemByHash(hash));
                    Legislate.viewLaw(hash);
                });
        },
        vote: function(e){
            //record this users vote
            var id = window.clientId;
            var vote = e.target.id;
            var hash = e.target.value;
            var txt = _legislation[hash];
            var obj = {};
            obj.uid = id;
            obj.hash = hash;
            obj.text = txt;
            obj.vote = vote;
            // console.log(obj)
            var json = JSON.stringify(obj);
            //send this users vote to the network
            _recordVotes(json).then((hash)=>{
                if(hash === false) return;
                Legislate.viewLaw(hash);
                Legislate.outputView(hash);
            });
            //display voting results

        },
        receiveVote: function(o){
            //receive this vote and record
            console.log("received vote",o)
            var obj = {};
            obj.uid = o.uid;
            obj.hash = o.hash;
            obj.text = o.text;
            obj.vote = o.vote;
            // console.log(obj)
            var json = JSON.stringify(obj);
            //send this users vote to the network
            _recordVotes(json).then((hash)=>{
                if(hash === false) return;
                Legislate.viewLaw(hash);
                Legislate.outputView(hash);
            });
            //display voting results

        },
        getResults: function(hash){
            if(_votes[hash] === undefined){
                console.log(_votes,"Waiting to receive records for request.");
                return;
            }
            return _votes[hash];
        },
        getItemByHash: function(hash){
            if(_legislation[hash] === undefined) return false;
            return b64DecodeUnicode(atob(_legislation[hash]));
        },
        outputView: function(hash){
            // console.log(_votes[hash]['voters']);
            var oVotes = _tallyVotes(hash);
            var a = window.view_area2;
            var voterCount = objectLength(_votes[hash].voters);
            console.log(oVotes.status);
            console.log(_votes[hash])
            // a.innerHTML += "<br>-----------------------";
            a.innerHTML = "<br>-----------------------";
            a.innerHTML += "<br>The legislation's status is: " + oVotes.status;
            a.innerHTML += "<br>Yea: " + _votes[oVotes.hash].totals.yea + ", Nay: " + _votes[oVotes.hash].totals.nay;
            a.innerHTML += "<br>" + voterCount + " of " + _network[hash].length + " have voted.";
            a.innerHTML += (voterCount < _network[hash].length)? "<br>" + (_network[hash].length - voterCount) + " voters remaining." : "<br>Voting is complete!";
            a.innerHTML += "<br>-----------------------";
            a.innerHTML += "<br>-----------------------";
        }
    }

}());

var hasProp = function(text){
    window.prop.readOnly = true;
    window.prop_button.disabled = true;
    if(text !== undefined){
        window.prop.value = text;
    }
    window.prop.style.backgroundColor = "#ccc"
}

var endProp = function(){
    window.prop.readOnly = false;
    window.prop_button.disabled = false;
    window.prop.value = "";
    window.prop.style.backgroundColor = "#fff"
}

var objectLength = function(object){
    c = 0;
    for(var x in object) c++;
    return c;
}

var showFromRecord = function(hash){
        // var h = window.lastHash;
        var area = window.view_area3;
        var yea = window.yea;
        var nay = window.nay;
        yea.id = "yea";
        nay.id = "nay";
        yea.value = hash;
        nay.value = hash;
        yea.innerHTML = "Yea";
        nay.innerHTML = "Nay";
        // area.innerHTML = Legislate.getItemByHash(hash) + "<br><br>";
        area.appendChild(yea);
        area.appendChild(document.createElement("br"));
        area.appendChild(document.createElement("br"));
        area.appendChild(nay);
        yea.onclick = Legislate.vote;
        nay.onclick = Legislate.vote;
}



////////////////EXTERNAL CODE///////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////
//https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
var safeSha1 = function(str){
    var buffer = new TextEncoder("utf-8").encode(str);
    return crypto.subtle.digest("SHA-1",buffer).then(function(val){
        var hexCodes = [];
          var view = new DataView(val);
          for (var i = 0; i < view.byteLength; i += 4) {
            var value = view.getUint32(i)
            var stringValue = value.toString(16)
            var padding = '00000000'
            var paddedValue = (padding + stringValue).slice(-padding.length)
            hexCodes.push(paddedValue);
          }
          return hexCodes.join("");
    });
    //used as safeSha1.then(function(is){ action(is); });
}
// https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
function b64EncodeUnicode(str) {
    // first we use encodeURIComponent to get percent-encoded UTF-8,
    // then we convert the percent encodings into raw bytes which
    // can be fed into btoa.
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
            return String.fromCharCode('0x' + p1);
    }));
}

function b64DecodeUnicode(str) {
    // Going backwards: from bytestream, to percent-encoding, to original string.
    return decodeURIComponent(atob(str).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
}
