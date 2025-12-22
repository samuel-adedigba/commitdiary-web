'use client'
// import node module libraries
import { Container, Row, Col } from 'react-bootstrap';

// import widget as custom components
import { PageHeading } from 'widgets'

// import sub components
import { DeleteAccount, GeneralSetting } from 'sub-components'

// import custom components
import ApiKeyManager from '/components/custom/ApiKeyManager';

const Settings = () => {
  return (
    <Container fluid className="p-6">

      {/* Page Heading */}
      <PageHeading heading="Settings" />

      {/* General Settings */}
      <GeneralSetting />

      {/* API Key Management */}
      <Row className="mb-8">
        <Col lg={3} md={4} sm={12}>
          <h4>API Keys</h4>
          <p className="mb-0">Manage your API keys for VS Code extension sync</p>
        </Col>
        <Col lg={9} md={8} sm={12}>
          <ApiKeyManager />
        </Col>
      </Row>

      {/* Email Settings */}
      {/* <EmailSetting /> */}

      {/* Settings for Preferences */}
      {/* <Preferences /> */}

      {/* Settings for Notifications */}
      {/* <Notifications /> */}

      {/* Delete Your Account */}
      <DeleteAccount />

    </Container>
  )
}

export default Settings