exports.handler = async (event, context) => {
  console.log("=== event.body ===");
  console.log(event.body);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "OK" })
  };
};
