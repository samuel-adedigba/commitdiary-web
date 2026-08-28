// import node module libraries
import { Row, Col } from 'react-bootstrap';

const PageHeading = props => {
  const { heading, as = 'h3' } = props;
  const Heading = as;
  return (
    <Row>
      <Col lg={12} md={12} xs={12}>
        {/* Page header */}
        <div className="border-bottom pb-4 mb-4 ">
          <Heading className="mb-0 fw-bold">{heading}</Heading>
        </div>
      </Col>
    </Row>
  )
}

export default PageHeading
