module Api
  class CannedResponsesController < ApplicationController
    def show
      response = CannedResponse.find(params[:id])
      response = response.as_json
      attachments = CannedResponseAttachment.where(canned_response_id: params[:id])
      response = response.merge(attachments: attachments)

      render json: response
    end
  end
end
