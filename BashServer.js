var BashServer = {};
    BashServer['ready'] = false;
    BashServer['Events'] = {
        Conn:{}
    }
    BashServer.init = function(url){
        if(url == undefined){
            url = "localhost:1337";
        }
        BashServer.ws = new WebSocket("ws://" + url);
        BashServer.ws.onmessage = function (evt) {
            var msg = evt.data;
            if(msg == "Ready"){
                BashServer.ready = true;
                $(BashServer.Events.Conn).trigger('ready');
            }else{
                msg = JSON.parse(msg);
                if(msg['result'] == true){
                    if(msg['data']['killed'] != undefined){
                        $(BashServer['Events'][msg['data']['name']]).trigger('killed');
                    }else if(msg['data']['stdout'] != undefined){
                        $(BashServer['Events'][msg['data']['name']]).trigger('stdout',[msg['data']['stdout']]);
                    }else if(msg['data']['stderr'] != undefined){
                        $(BashServer['Events'][msg['data']['name']]).trigger('stderr',[msg['data']['stderr']]);
                    }else if(msg['data']['exit'] != undefined){
                        $(BashServer['Events'][msg['data']['name']]).trigger('exit',[msg['data']['exit'],msg['data']['signal']]);
                    }
                }
            }
        };
        BashServer.ws.onclose = function(){
            if(BashServer.ready){
                $(BashServer.Events.Conn).trigger('disconnect');
            }else{
                $(BashServer.Events.Conn).trigger('denied');
            }
        };
    }
    BashServer.rand = function (from, to){
       return Math.floor(Math.random() * (to - from + 1) + from);
    }
    BashServer.exec = function(options){
        var Name = "Conn";
        //Generate a random number until a fresh one is found
        while(BashServer['Events'][Name] != undefined){
            Name = Math.floor(Math.random() * 10000000000);
        }
        BashServer.ws.send(JSON.stringify({
            Name:Name,
            Command:options['Command']
        }));
        BashServer['Events'][Name] = {};
        var cmd = {};
        cmd.stdin = function(data){
            BashServer.ws.send(JSON.stringify({
                Name:Name,
                stdin:data
            }));
        }
        cmd.kill = function(signal){
            BashServer.ws.send(JSON.stringify({
                Name:Name,
                kill:signal
            }));
        }
        if(options.onstart != undefined){
            options.onstart(cmd);
        }
        $(BashServer['Events'][Name]).bind("stdout", function(event, data){
            if(options.stdout != undefined){
                options.stdout(data, cmd);
            }
        });
        $(BashServer['Events'][Name]).bind("stderr", function(event, data){
            if(options.stderr != undefined){
                options.stderr(data, cmd);
            }
        });
        $(BashServer['Events'][Name]).bind("exit", function(event, code, signal){
            delete BashServer['Events'][Name];
            if(options.exit != undefined){
                options.exit(code, signal);
            }
        });
    }