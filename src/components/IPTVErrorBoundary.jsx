import { Component } from "react";

export default class IPTVErrorBoundary extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error, info) {
    console.error("KadoTV IPTV Runtime Error:", error);
    console.error("IPTV Component Stack:", info?.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <section
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "30px 18px",
          textAlign: "center",
          color: "#fff"
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "520px",
            padding: "28px",
            borderRadius: "22px",
            background: "rgba(255,255,255,.045)",
            border: "1px solid rgba(255,255,255,.09)"
          }}
        >
          <div style={{ fontSize: "42px", marginBottom: "12px" }}>
            ⚠️
          </div>

          <h2 style={{ margin: "0 0 10px" }}>
            IPTV haikuweza kufunguka
          </h2>

          <p
            style={{
              color: "#8b95aa",
              fontSize: "13px",
              lineHeight: 1.6,
              marginBottom: "18px"
            }}
          >
            Kuna tatizo kwenye IPTV. KadoTV yenyewe haijaanguka.
          </p>

          <div
            style={{
              textAlign: "left",
              padding: "12px",
              marginBottom: "18px",
              borderRadius: "12px",
              background: "rgba(255,60,80,.08)",
              border: "1px solid rgba(255,60,80,.15)",
              color: "#ff8b9a",
              fontSize: "11px",
              wordBreak: "break-word"
            }}
          >
            {this.state.error?.message || "Unknown IPTV error"}
          </div>

          <button
            type="button"
            onClick={this.handleReload}
            style={{
              border: 0,
              borderRadius: "12px",
              padding: "12px 18px",
              background: "#67e8f9",
              color: "#031014",
              fontWeight: 800,
              cursor: "pointer"
            }}
          >
            Reload KadoTV
          </button>
        </div>
      </section>
    );
  }
}
