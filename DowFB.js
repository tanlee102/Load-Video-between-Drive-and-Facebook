const http      = require('http'),
      https     = require('https');
const path = require("path");
const fs = require("fs");
let fetch = require("node-fetch");
const { exec } = require("child_process");
const {google} = require('googleapis');
var MongoClient = require('mongodb').MongoClient;
var urli = "mongodb://localhost:27017/";
let timepk = 0;

let code = 9;
let namevideo = 'blackclover_tap_';
let xmin = 0;
let xmax = 50;
let preventArr = [];

let pagefb = '103083858598351';
let tokenfb = 'EAApj1qd5BwYBAPtLSiHdJEZAURjZB3vXbB5MKo0R6YFDYSZASuJpK9XgnCMnMjf4K0EQkVAnSX5UTsTOUTZCpD2eZBaXZC5q8HwjiNKWNHGRu1fJks3tJI3KADVPOk5cDO860ZCXaFJFGk2k6ZCSgQ8fAryGGWSj7pOwZCgiBI4UxhASMF3FOiotd8i6ig11jQTAZD';

let xcode = 22;

let i = 1;
let k = 1;

MongoClient.connect(urli , { useUnifiedTopology: true } ,async function(err, db) {
    if (err) throw err;
    var dbo = await db.db("aidb");
    var dbo = await dbo.collection("danh_sach_driveapi");


async function createDrive(index){
    let query = { index: Number(index)};
    let select = await dbo.find(query).toArray();
        select = JSON.parse(JSON.stringify(select[0]));
    let key_api = select.key_api; 
    let access_token = select.access_token; 
    console.log("KeyAPI="+key_api);
    let oAuth2Client = new google.auth.OAuth2();
    oAuth2Client.setCredentials({
      access_token:access_token,
      scope: 'https://www.googleapis.com/auth/drive',
    });
    let drive = google.drive({version: 'v3', auth:oAuth2Client});
    return {drive:drive, key_api: key_api}
}


async function loadurl(url,id,name){
    console.log(url,name)
    let fetchs = await fetch(url, {"method": "GET",});
    fetchs = await fetchs.json();
    data_array = JSON.parse(JSON.stringify(fetchs,null,2));
    const file = fs.createWriteStream('Save/'+name);
    let pkx = 0;
    const request = https.get(data_array.source, function(response) {
        response.pipe(file);
        response.on('data',(da)=>{
            pkx = pkx + 1;
            process.stdout.clearLine();
            process.stdout.cursorTo(0);
            process.stdout.write('load number data '+name+' : ' + pkx)
        })  
        response.on('end',async ()=>{
            process.stdout.write("\n");
            console.log('Done!');
            
            let xdrive = (await createDrive(xcode)).drive;
            let fileMetadata = {
                'name': name
              };
              var media = {
                mimeType: 'video/mp4',
                body: fs.createReadStream('Save/'+name)
              };
              xdrive.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id'
              }, function (err, file) {
                if (err) {
                  console.log("bi loi file:" + err)
                } else {
                  console.log('Thành công'+ name);
                }
              });
        })
    });
}


// function AsyncDow(str,name){
//   console.log(name)
//     let ls = exec(str);
//     ls.stdout.on("data", data => {
//         console.log("end="+String(data).replace('{"id":"','').replace('"}',''))
//         let idvideox = String(String(data).replace('{"id":"','').replace('"}',''));
//         setTimeout(function(){ 
//             loadurl('https://graph.facebook.com/'+ idvideox + '?access_token=' + tokenfb + '&fields=source',idvideox,name)
//         }, 60000*10);
//     });
//     ls.stderr.on("data", data => {
//         console.log(`stderr: ${data}`);
//     });
//     ls.on('error', (error) => {
//         console.log(`error: ${error.message}`);
//     });
//     ls.on("close", code => {
//         console.log(`child process exited with code ${code}`);
//     });
// }



let drive = (await createDrive(xcode)).drive;
let pageToken = '';
function checkDrive(){
    drive.files.list({
          pageSize: 100,
          fields: 'nextPageToken, files(*)',
          pageToken: pageToken
          }, async (err, res) => {
            if (err) return console.log('The API returned an error: ' + err);
            const files = res.data.files;
            if(String(res.data.nextPageToken) === "undefined") pageToken = 'het';
            else {
              pageToken = res.data.nextPageToken;
              checkDrive();
            }

            if (files.length) {
              console.log('Files:' + files.length);
              for(let i = 0; i < files.length; i++){
                if(String(files[i].name).includes(".mp4") && String(files[i].name).includes(namevideo)){
                    let nametempx = String(files[i].name).replace(String(namevideo),'').replace('.mp4','');
                    if(Number(nametempx) >= xmin && Number(nametempx) <= xmax){
                      console.log(nametempx+"---XX")
                      preventArr.push(Number(nametempx));
                    }
                }
              }
            } else {
              console.log('No files found.');
            }


            if(pageToken === 'het'){
              setTimeout(async function (){
                pageToken = '';
                console.log("XXXXXXXXXXXXXXXXXxxxxxx");
                
                function getLink(id_page,token) {
                    let url = 'https://graph.facebook.com/'+ id_page + '/videos?limit=1000&access_token=' + token;
                    let client = http;
                    if (url.toString().indexOf("https") === 0) {
                        client = https;
                    }
                    let request = client.request(url, function (res) {
                        let data = '';
                            res.on('data', function (chunk) {
                                data += chunk;
                            });
                            res.on('end', function () {
                                let data_array = JSON.parse(data);  
                                let json_ray = data_array.data;
                                json_ray.forEach(element => {
                                    // console.log(Number(element.description))
                                    if (preventArr.indexOf(Number(String(element.description).replace(namevideo,'').replace('.mp4',''))) === -1)
                                    if(Number(String(element.description).replace(namevideo,'').replace('.mp4','')) >= xmin && Number(String(element.description).replace(namevideo,'').replace('.mp4','')) <= xmax)
                                    if (!fs.existsSync(String('Save/'+element.description))) {
                                    if(k == 1){
                                        loadurl('https://graph.facebook.com/'+ element.id + '?access_token=' + tokenfb + '&fields=source',element.id,element.description)
                                        k = k + 1;
                                    }else{
                                        setTimeout(function(){
                                            loadurl('https://graph.facebook.com/'+ element.id + '?access_token=' + tokenfb + '&fields=source',element.id,element.description)
                                        },5*60000*k)
                                        k = k + 1;
                                    }
                                    }
                
                                });
                            });
                        });
                        request.on('error', function (e) {
                            console.log(e.message);
                        });
                        request.end();
                }
                getLink(pagefb,tokenfb);
                




              },3000);
            }
          });
        }
checkDrive();
});