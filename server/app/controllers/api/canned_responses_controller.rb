module Api
  class CannedResponsesController < ApplicationController
    def show
      freshdesk_service = Freshdesk::CannedResponseService.new
      response = freshdesk_service.get_response(params[:id])
      render json: response
    end
  end
end
