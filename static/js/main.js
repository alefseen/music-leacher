$(document).ready(function(){        
    $('#sub').click (function(){
        var json = { url : $('#url').val() , albumtitle : 'Single' , albumartists : [""] , track : ""}
        $.post("/singledl" , json , function(data){
            $('#info').append('<div id="'+data['id']+'"><a href="http://localhost/?p='+data['postid'] +'"> '+ data['artists']+" - "+data['title']+'</a>'+
            '<button class="postit" value="post it!" onclick="addspost(&apos;'+data['id']+'&apos;,&apos;'+data['albumtitle']+'&apos;)">post it!</button>'
            +'<input id="'+data['id']+'t" placeholder="example : کما "></input>'
            +'<input id="'+data['id']+'a" placeholder="example : رضا پیشرو,اوج,..."></input>'
            +'</div><br/>');
        })
    })
    $('#sub1').click (function(){
        var json = { url : $('#url').val() }
        $.post("/albumdl" , json , function(data){
            var ad=data[0];
            $('#info').append('<div id="'+ad['albumtitle']+'"><a href="http://localhost/?p='+ad['postid'] +'"> '+ ad['albumartists']+" - "+ad['albumtitle']+'</a>'+
            '<button class="postit" value="post it!" onclick="addapost(&apos;'+ad['albumtitle']+'&apos;,&apos;'+ad['albumartists']+'&apos;)">post album!</button>'
            +'<input id="'+ad['albumtitle'].split(' ')[0]+'t" placeholder="example : کما "></input>'
            +'<input id="'+ad['albumtitle'].split(' ')[0]+'a" placeholder="example : رضا پیشرو,اوج,..."></input>'
            +'</div><br/>');
                        for (var i=1;i<data.length;i++){
                            $('#info').append('<div id="'+data[i]['id']+'"><a href="http://localhost/?p='+data[i]['postid'] +'"> '+ data[i]['artists']+" - "+data[i]['title']+'</a>'+
                            '<button class="postit" value="post it!" onclick="addspost(&apos;'+data[i]['id']+'&apos;,&apos;'+data['albumtitle']+'&apos;)">post it!</button>'
                            +'<input id="'+data[i]['id']+'t" placeholder="example : کما "></input>'
                            +'<input id="'+data[i]['id']+'a" placeholder="example : رضا پیشرو,اوج,..."></input>'
                            +'</div><br/>');            }
        })
    })

   

});
function addspost(id,at){
var ftitle = $('#'+id+'t').val();
var fartists = $('#'+id+'a').val().split(',');
var falbumtitle = "سینگل";
//alert($('#'+id+'l').length);
if($('#'+at.split(' ')[0]+'t').length !== 0){
falbumtitle = $('#'+id+'l').val();}
    var json = {'id' : id ,'ftitle':ftitle , 'fartists':fartists , 'falbumtitle':falbumtitle}
    $.post("/postits" , json , function(data){
        $('#'+id).html('<p>'+data['title']+' added'+
        '<a href="http://'+data['site']+'/?p='+data['postid']+'">show post</a></p>');
    }) 
}