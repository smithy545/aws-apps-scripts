var AWS = (function() {
  var accessKey;
  var secretKey;
  
  return {
    init: function AWS(access_key, secret_key) {
      accessKey = access_key;
      secretKey = secret_key;
    },
    request: function(service, region, action, params, method, payload, headers, uri) {
      var window = {};
      window.Crypto = undefined;
      loadCrypto(window, window.Crypto);
      loadSHA256(window, window.Crypto);
      var Crypto = window.Crypto;
      
      var d = new Date();
      var dateStringFull =  String(d.getFullYear()) + addZero(d.getMonth()+1) + addZero(d.getDate()) + "T" + addZero(d.getUTCHours()) + addZero(d.getUTCMinutes()) + addZero(d.getUTCSeconds()) + 'Z';
      var dateStringShort = String(d.getFullYear()) + addZero(d.getMonth()+1) + addZero(d.getDate());
      
      var payload = payload || '';
      var method = method || "GET";
      var uri = uri || "/";
      var host = service+"."+region+".amazonaws.com";
      var request;
      var query;
      if(method.toLowerCase() == "post") {
        request = "https://"+host+uri;
        query = '';
      } else {
        query = "Action="+action;
        if(params) {
          for(var name in params) {
            query += "&"+name+"="+params[name];
          }
        }
        request = "https://"+host+uri+"?"+query;
      }
      
      var canonQuery = getCanonQuery(query);
      var canonHeaders = "";
      var signedHeaders = "";
      headers["Host"] = host;
      headers["X-Amz-Date"] = dateStringFull;
      Object.keys(headers).sort(function(a,b){if(a < b) return -1;if(a > b) return 1;return 0;}).forEach(function(h, index, ordered) {
        canonHeaders += h.toLowerCase() + ":" + headers[h] + "\n";
        signedHeaders += h.toLowerCase() + ";";
      });
      signedHeaders = signedHeaders.substring(0, signedHeaders.length-1);
      
      var CanonicalString = method+'\n'
      + uri+'\n'
      + query+'\n'
      + canonHeaders+'\n'
      + signedHeaders+'\n'
      + Crypto.SHA256(payload);
      var canonHash = Crypto.SHA256(CanonicalString);
      
      var algorithm = "AWS4-HMAC-SHA256";
      var scope = dateStringShort + "/"+region+"/"+service+"/aws4_request";
      
      var StringToSign = algorithm+'\n'
      + dateStringFull+'\n'
      + scope+'\n'
      + canonHash;
      
      var key = getSignatureKey(Crypto, secretKey, dateStringShort, region, service);
      var signature = Crypto.HMAC(Crypto.SHA256, StringToSign, key, { asBytes: false });
      
      var authHeader = algorithm +" Credential="+accessKey+"/"+scope+", SignedHeaders="+signedHeaders+", Signature="+signature;
      
      headers["Authorization"] = authHeader;
      delete headers["Host"];
      var options = {
        method: method,
        headers: headers,
        muteHttpExceptions: true,
        payload: payload,
      };
      
      var response = UrlFetchApp.fetch(request, options);
      return response;
    },
    setNewKey: function(access_key, secret_key) {
      accessKey = access_key;
      secretKey = secret_key;
    }
  };
  
  function getCanonQuery(r) {
    var index = r.indexOf('?');
    if(index == -1) {
      return '';
    }
    var query = r.substring(index+1).split("");
    
    var canon = "";
    for(var element in Object.keys(query).sort()) {
      if(isCanon(element)) {
        canon += element;
      } else {
        canon += "%"+element.charCodeAt(0).toString(16)
      }
    }
    
    return canon;
  }
  
  // For characters only
  function isCanon(c) {
    return /[a-z0-9-_.~=&]/i.test(c);
  }
  
  function addZero(s) {
    if(Number(s) < 10) {
      return '0' + String(s);
    }
    return String(s);
  }
  
  function getSignatureKey(Crypto, key, dateStamp, regionName, serviceName) {
    var kDate= Crypto.HMAC(Crypto.SHA256, dateStamp, "AWS4" + key, { asBytes: true})
    var kRegion= Crypto.HMAC(Crypto.SHA256, regionName, kDate, { asBytes: true });
    var kService=Crypto.HMAC(Crypto.SHA256, serviceName, kRegion, { asBytes: true });
    var kSigning= Crypto.HMAC(Crypto.SHA256, "aws4_request", kService, { asBytes: true });
    
    return kSigning;
  }
})();
