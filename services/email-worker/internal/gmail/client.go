package gmail

// CommerceQuery is the minimum-scope Gmail search filter per ReturnRider privacy spec.
const CommerceQuery = `newer_than:90d (subject:(order OR receipt OR confirmation OR return OR refund OR shipment OR tracking) OR from:(noreply OR no-reply OR orders OR shipping OR returns))`

const ReadonlyScope = "https://www.googleapis.com/auth/gmail.readonly"

type Client struct {
	clientID     string
	clientSecret string
}

func New(clientID, clientSecret string) *Client {
	return &Client{clientID: clientID, clientSecret: clientSecret}
}
