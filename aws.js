var AWS = (function() {
  // Keys cannot be retrieved once initialized but can be changed
  var accessKey;
  var secretKey;
  
  return {
    /**
     * Sets up keys for authentication so you can make your requests. Keys are not gettable once added.
     * @param {string} access_key your aws access key
     * @param {string} secret_key your aws secret key
     */
    init: function AWS(access_key, secret_key) {
      accessKey = access_key;
      secretKey = secret_key;
    },
    /**
     * Authenticates and sends the given parameters for an AWS api request.
     * @param {string} service the aws service to connect to (e.g. 'ec2', 'iam', 'codecommit')
     * @param {string} region the aws region your command will go to (e.g. 'us-east-1')
     * @param {string} action the api action to call
     * @param {Object} params the parameters to call on the action. Defaults to none.
     * @param {string} method the http method (e.g. 'GET', 'POST'). Defaults to GET.
     * @param {string} payload the payload to send. Defults to ''.
     * @param {Object} headers the headers to attach to the request. Host and X-Amz-Date are premade for you.
     * @param {string} uri the path after the domain before the action. Defaults to '/'.
     * @return {string} response the server response to the request
     */
    request: function(service, region, action, params, method, payload, headers, uri) {
      if(service == undefined) {
        throw "Error: Service undefined";
      } else if(region == undefined) {
        throw "Error: Region undefined";
      } else if(action == undefined) {
        throw "Error: Action undefined";
      }
      
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
      var headers = headers || {};
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
    /**
     * Sets new authorization keys
     * @param access_key {string} the new access_key
     * @param secret_key {string} the new secret key
     */
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
