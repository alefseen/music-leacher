var request = require('request');
var cheerio = require('cheerio');
var express = require('express');
var bodyParser = require('body-parser');
const fs = require('fs');
const ID3Writer = require('browser-id3-writer');
var wordpress = require("wordpress");
let googleTransliterate = require('google-input-tool');
const { DownloaderHelper } = require('node-downloader-helper');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const Remover = require('remove-id3v1');
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/songs', {useNewUrlParser: true});
var db = mongoose.connection;
db.on('error', function () { console.log('db have error.') });
db.on('connected', function () { console.log('db connected.') });
var cacheid;
const SingleSchema = new mongoose.Schema({
  cover: String,
  song: String,
  title: String,
  artists: [String],
  ftitle: String,
  fartists: [String],
  albumtitle : String,
  falbumtitle : String,
  sourcelink: String,
  postid: String
});
const SingleModel = new mongoose.model('song', SingleSchema);

//website data :
var SITEADDRESS = "localhost/www/wp2";
var USERNAME = "amir";
var PASSWORD = "1";

var app = express();
app.use(express.static(__dirname + '/static'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.post('/singledl', function (reqq, resp, next) {
  var json = {
    artists: "",
    title: "",
    link: "",
    path: "",
    cover: "",
    cpath: "",
    albumartists: "",
    albumtitle: "",
    track: "",
    source:""
  }
  var url = reqq.body['url'];
  json.source = url;
  json.albumartists = reqq.body['albumartists'];
  json.albumtitle = reqq.body['albumtitle'];
  json.track = reqq.body['track'];
  if (json.albumtitle == "") { json.albumtitle = "Single"; }
  console.log("start dl :   " + url);




  request(url, function (err, req, html) {
    if (err) { console.log('have an error in url request') }
    else {
      json.track = reqq.body['track'];
      var $ = cheerio.load(html);
      $('.coverdesc').filter(function () {
        var data = $(this);
        var artist = data.find($('h1'));
        var title = data.find('h2');
        var artists = [];
        artist.find($('a')).each(function (i, elem) {
          artists[i] = $(this).text();
        });
        json.artists = artists;
        json.title = title.text();
      })
      $('#downloadBox').filter(function () {
        var href = $(this).find('a');
        json.link = href.attr('href');
        var x = "";
        for (i in json.artists) {
          if (x != "") { x += ' ft. ' }
          x += json.artists[i];
        }
        var y = "";
        for (i in json.albumartists) {
          if (y != "") { y += ' ft. ' }
          y += json.albumartists[i];
        }
        var z = "";
        if (json.albumtitle == "Single") { z = "Single/"; }
        else { z = y + " - " + json.albumtitle + "/"; }
        json.path = './files/' + z + x + ' - ' + json.title + '.mp3';
        if (!fs.existsSync('./files/' + z)) {
          fs.mkdirSync('./files/' + z);
        }
        console.log("start downloading");
        $('#cover').filter(function () {
          var co = $(this).find('img');
          var x = "";
          for (i in json.artists) {
            if (x != "") { x += ' ft. ' }
            x += json.artists[i];
          }
          json.cpath = co.attr('src');
        });
        json.cover = './covers/' + x + ' - ' + json.title + '.jpg';
        resp.send(json);
        resp.end();
        const dl = new DownloaderHelper(json.link, './files/' + z, {
          method: 'GET', // Request Method Verb
          fileName: x + ' - ' + json.title + '.mp3', // Custom filename when saved
          override: true
        });
        dl.on('end', () => {
          console.log('Download Completed: \t' + json.title); 
          rewritetags(json);
        })
          const dl1 = new DownloaderHelper(json.cpath, './covers', {
            method: 'GET', // Request Method Verb
            fileName: x + ' - ' + json.title + '.jpg', // Custom filename when saved
            override: true
          });
          
          dl1.on('end', () => {
            console.log('Download cover Completed');
            getper(json.title, function (res) {
              json.ftitle = res;
              var at='';
              json.artists.forEach(element => {
                at+='^'+element;
              });
              at=at.substring(1);
              var aat='';
              json.albumartists.forEach(element => {
                aat+='^'+element;
              });
              aat=aat.substring(1);
              console.log(at);
              getper(at, function (res) {
                json.fartists = res.split('^');
                getper(json.albumtitle, function (res) {
                  json.falbumtitle = res;
                  getper(aat, function (res) {
                    json.falbumartists = res.split('^');
                    console.log(json.source);

                      SingleModel.findOneAndRemove({sourcelink:json.source}, function(err,result)
                      {
                        if(err)console.log(err);
                        if(result){console.log(result._id + ' removed')}
                      
                    wp(json, SITEADDRESS, USERNAME, PASSWORD, function (id) {
                      var amir = new SingleModel({
                        cover :  json.cover,
                        song : json.path,
                        title : json.title,
                        artists : json.artists,
                        ftitle : json.ftitle,
                        fartists : json.fartists,
                        albumtitle : json.albumtitle,
                        falbumtitle : json.falbumtitle,
                        sourcelink : json.source,
                        postid : id
                      });
                      json.postid=id;
                      
                      amir.save(function(err,o){
                        if(err) return
                        console.log(o);
                      });
                    });
                  });
                  })
                })
              })
            })

          })
          dl1.start();
        dl.start();
      })
    }
  })
})

app.post('/albumdl', function (req, resp, next) {
  var mjson;
  var url = req.body['url'];
  var responses = [];
  console.log("start dl album :   " + url);
  request(url, function (err, req, html) {
    if (err) { console.log('have an error in url request') }
    else {
      var $ = cheerio.load(html);
      $('.coverdesc').filter(function () {
        var data = $(this);
        var albumartist = data.find($('h1'));
        var albumtitle = data.find('h2');
        var albumartists = [];
        albumartist.find($('a')).each(function (i, elem) {
          albumartists[i] = $(this).text();
        });
        mjson = { albumartists: "", albumtitle: "", url: "", track: "" }
        mjson.albumartists = albumartists;
        mjson.albumtitle = albumtitle.text();
      })
      $('.playlist').filter(function () {
        var listmusic = $(this).find($('#trackList'));
        listmusic.find($('li')).each(function (i, elem) {
          mjson.track = i + 1;
          mjson.url = $(this).attr('data-post');
          var options = {
            url: 'http://localhost:8000/singledl',
            method: 'POST',
            json: mjson
          };

          request(options, function (error, response, body) {
            if (!error) {
              responses.push(response.body);
            }
          });

        });
        
      })
      setTimeout(() => {
        resp.send(responses);
        resp.end();
        var awt='';
              mjson.albumartists.forEach(element => {
                awt+='^'+element;
              });
              awt=awt.substring(1);
        getper(mjson.albumtitle,function(d){
          mjson.falbumtitle=d;
          getper(awt,function(d){
            mjson.falbumartists=d.split('^');
            wpa(responses,mjson, SITEADDRESS, USERNAME, PASSWORD, function (id) {
              console.log('album added \t'+id);
              cacheid=id;
            });
          })
        })
        


      }, 8000);
      
    }
  })
})

function rewritetags(jsonn) {
  console.log('rewrite tags is starting for : ' + jsonn.title);
  const songBuffer = fs.readFileSync(jsonn.path);
  const coverBuffer = fs.readFileSync(jsonn.cover);
  Remover.removeTag(songBuffer);
  //console.log(jsonn);
  const writer = new ID3Writer(songBuffer);
  writer.setFrame('TIT2', jsonn.title)
    .setFrame('TPE1', jsonn.artists)
    .setFrame('TALB', jsonn.albumtitle)
    .setFrame('TYER', 2018)
    .setFrame('TRCK', jsonn.track)
    .setFrame('TPE2', jsonn.albumartists)
    .setFrame('APIC', {
      type: 3,
      data: coverBuffer,
      description: 'Super picture'
    })
    ;
  //console.log('sdasdads');

  writer.addTag();

  const taggedSongBuffer = Buffer.from(writer.arrayBuffer);
  fs.writeFileSync(jsonn.path, taggedSongBuffer);
  console.log('tags rewrited.');

}


app.get('/', function (req, resp, next) {
  resp.sendfile(__dirname + '/static/home.html');
})
app.listen(8000);


function wp(o, site, user, pass, callback) {
  var client = wordpress.createClient({
    url: site,
    username: user,
    password: pass
  });
  var file = fs.readFileSync(o.cover);
  console.log('adding post \t'+o.title);
  client.uploadFile({
    name: o.title+'.jpg',
    type: "image/jpg",
    bits: file
  }, function (error, data) {
    if (error) {console.log('and'+error); return;}
    var con = "Download new track " + o.artists + " called " + o.title + " from " + o.albumtitle + " album."
    var conf = "دانلود آهنگ جدید " + o.fartists + " به نام " + o.ftitle + " از آلبوم  " + o.albumtitle;
    var dataa = {
      title: o.title,
      content: con + "\n" + conf,
      status: "publish",
      termNames: {
        "category": o.artists,
        "post_tag": [o.albumtitle, o.falbumtitle]

      },
      thumbnail: data['id'],
      customFields: [
        { 'key': "_yoast_wpseo_metatitle", 'value': "Download " + o.artists + " - " + o.title + " دانلود آهنگ " + o.ftitle + " از " + o.fartists },
        { 'key': "_yoast_wpseo_metadesc", 'value': con + "  " + conf },
        { 'key': "_yoast_wpseo_focuskw", 'value': o.title }
      ]
    }
    client.newPost(dataa, function (err, id) {
      if (err) {  
        console.log('this error'+err); return }
     else{ callback(id);}
    })
  });

}

function wpa(o,a, site, user, pass, callback) {
   
  var client = wordpress.createClient({
    url: site,
    username: user,
    password: pass
  });
  var file = fs.readFileSync(o[0].cover);
  console.log('all done');
  client.uploadFile({
    name: a.albumtitle+'.jpg',
    type: "image/jpg",
    bits: file
  }, function (error, data) {
    
    if (error) {console.log('and'+error); return;}
    var con = "Download new album " + a.albumartists + " called " + a.albumtitle;
    var conf = " دانلود آلبوم جدید " + a.falbumartists + " به نام " + a.falbumtitle;
    var musics = "";
    var tags = [];
    var postlinks = [];
    o.forEach(e => {
      SingleModel.findOne({sourcelink:e.source},function(err,result){
        if(err || !result) postlinks.push('#');
        else{postlinks.push(result.postid)}
      })
      tags.push(e.title);
      tags.push(e.ftitle);
      musics += e.artists + ' - ' + e.title + ' dl on ' + e.path + '\n';
      });
      console.log(postlinks);
    var dataa = {
      title: a.albumtitle,
      content: con + "\n" + conf + '\n' + musics,
      status: "publish",
      termNames: {
        "category": a.albumartists,
        "post_tag": tags
      },
      thumbnail: data['id'],
      customFields: [
        { 'key': "_yoast_wpseo_metatitle", 'value': "Download " + a.albumartists + " - " + a.albumtitle + " دانلود آهنگ " + a.falbumtitle + " از " + a.falbumartists },
        { 'key': "_yoast_wpseo_metadesc", 'value': con + "  " + conf },
        { 'key': "_yoast_wpseo_focuskw", 'value': a.albumtitle }
      ]
    }
    client.newPost(dataa, function (err, id) {
      if (err) {  
        console.log('this error'+err); return }
     else{ callback(id);}
    })
  });

}

function getper(input, callback) {
  if(input=="") return callback('')
  else{
  let request = new XMLHttpRequest();
  googleTransliterate(request, input, 'fa-t-i0-und', 1)
    .then(function (response) {
      return callback(response[0]);
    });
  setTimeout(() => { return ""; }, 2000);}
}
