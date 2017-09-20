# aws-apps-scripts
An interface to authenticate AWS api requests from within google apps scripts.

How to use:

1. Create a new project in google scripts.

2. Copy paste aws.js into it's own file in your project and save it.

3. Open up a new a file and setup the AWS variable with AWS.init.

4. Use AWS.request with whatever AWS API request you need! Make sure the headers and parameters are correctly set up, though. This function only sets up the Host, X-Amz-Date, and Authorization headers by default.

Command usage:
```javascript
AWS.request(
  service,
  region,
  action,
  params={},
  method='GET',
  payload='',
  headers={"Host":"GeneratedHost", "X-Amz-Date":"GeneratedX-Amz-Date"},
  uri='/'
)
```

Example:
```javascript
function myFunction() {
  AWS.init("MY_ACCESS_KEY", "MY_SECRET_KEY");
  var instanceXML = AWS.request('ec2', 'us-east-1', 'DescribeInstances', {"Version":"2015-10-01"});
  ...
}
```
