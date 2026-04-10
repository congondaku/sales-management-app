import "./Loading.css";

const Loading = () => {
  return (
    <div className="loading-overlay" role="status" aria-busy="true" aria-live="polite">
      <CutoutTextLoader
        height="450px"
        background="rgba(14, 23, 42, 0.9)"
        imgUrl="https://congondaku.s3.us-east-1.amazonaws.com/real-estate-listings/1775646035330-633521149.jpg"
      />
    </div>
  );
};

const CutoutTextLoader = ({ height, background, imgUrl }) => {
  return (
    <div className="cutout-container" style={{ height }}>
      {/* Background image */}
      <div
        className="cutout-bg"
        style={{
          backgroundImage: `url(${imgUrl})`,
        }}
      />
      {/* Pulsing wash */}
      <div
        className="cutout-wash"
        style={{ background }}
      />
      {/* Cutout text */}
      <div
        className="cutout-text"
        style={{
          backgroundImage: `url(${imgUrl})`,
        }}
      >
        Loading...
      </div>
    </div>
  );
};

export default Loading;
