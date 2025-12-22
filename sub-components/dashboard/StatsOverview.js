// import node module libraries
import { Col } from "react-bootstrap";
// import widget/custom components
import { StatRightTopIcon } from "widgets";

const StatsOverview = ({ statsData }) => {
  return (
    <>
      {statsData.map((item, index) => {
        return (
          <Col xl={3} lg={6} md={12} xs={12} className="mt-6" key={index}>
            <StatRightTopIcon info={item} />
          </Col>
        );
      })}
    </>
  );
};

export default StatsOverview;
